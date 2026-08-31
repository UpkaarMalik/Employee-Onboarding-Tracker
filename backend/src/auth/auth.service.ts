import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { StringValue } from 'ms';
import { MailService } from '../mail/mail.service';
import Mail from 'nodemailer/lib/mailer';

interface UserRow {
  id: string;
  full_name: string;
  role: string;
  password_hash: string;
  temp_email: string | null;
  email: string | null;
  is_temp_email_active: boolean;
  must_change_password: boolean;
  is_active: boolean;
}

interface AccessTokenPayload {
  sub: string;
  role: string;
  jti: string;
  mustChangePassword: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly mailService:MailService,
  ) {}

  private async findUserByIdentifier(identifier: string): Promise<UserRow | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT id, full_name, role, password_hash, temp_email, email,
              is_temp_email_active, must_change_password, is_active
       FROM users
       WHERE temp_email = $1 OR email = $1
       LIMIT 1`,
      [identifier],
    );
    return rows[0] ?? null;
  }

  async login(identifier: string, password: string) {
  const user = await this.findUserByIdentifier(identifier);
  if (!user || !user.is_active) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Block login via the retired temp_email once the user has transformed
  // to their official email (temp_email is kept on the row for record-keeping,
  // never nulled out — only the flag changes).
  if (!user.is_temp_email_active && identifier === user.temp_email) {
    throw new UnauthorizedException(
      'This temporary email is no longer valid. Use your official company email.',
    );
  }

  const { accessToken, refreshToken } = await this.issueTokens(
    user.id,
    user.role,
    user.must_change_password,
  );

  return {
    accessToken,
    refreshToken,
    mustChangePassword: user.must_change_password,
    user: { id: user.id, fullName: user.full_name, role: user.role },
  };
}

  private async issueTokens(userId: string, role: string, mustChangePassword: boolean) {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      { sub: userId, role, jti , mustChangePassword} as AccessTokenPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue ,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as StringValue,
      },
    );

    // Single active refresh token per user — storing it lets us revoke on
    // logout/password-change/role-change, and rotate on every refresh call.
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    await this.redis.set(`refresh_token:${userId}`, refreshToken, sevenDaysInSeconds);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.redis.get(`refresh_token:${payload.sub}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const { rows } = await this.db.query<{
      role: string;
      is_active: boolean;
      must_change_password: boolean;
    }>(
      `SELECT role, is_active, must_change_password
      FROM users
      WHERE id = $1`,
      [payload.sub],
    );

    const user = rows[0];

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User no longer active');
    }

    // Rotate: issue a brand new access + refresh token pair
    const { accessToken, refreshToken: newRefreshToken } =
      await this.issueTokens(
        payload.sub,
        user.role,
        user.must_change_password,
      );
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, accessTokenJti: string, accessTokenExpiresAt: number) {
    await this.redis.del(`refresh_token:${userId}`);

    // Blacklist the current access token for its remaining natural lifetime,
    // so it can't be reused even though it hasn't technically expired yet.
    const remainingSeconds = Math.max(
      accessTokenExpiresAt - Math.floor(Date.now() / 1000),
      0,
    );
    if (remainingSeconds > 0) {
      await this.redis.set(`blacklist:${accessTokenJti}`, '1', remainingSeconds);
    }
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return this.redis.exists(`blacklist:${jti}`);
  }

  // Called by users/auth flows elsewhere (password change, role change) to
  // force re-login by revoking the refresh token immediately.
  async revokeRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`refresh_token:${userId}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { rows } = await this.db.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId],
    );
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.db.query(
      'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2',
      [newHash, userId],
    );

    // Force re-login on all devices — old refresh token is now invalid
    await this.revokeRefreshToken(userId);
  }

  async getPendingTransform(userId: string): Promise<{ pendingOfficialEmail: string | null }> {
  const { rows } = await this.db.query<{ pending_official_email: string | null }>(
    'SELECT pending_official_email FROM users WHERE id = $1',
    [userId],
  );
  if (rows.length === 0) {
    throw new UnauthorizedException('User not found');
  }
  return { pendingOfficialEmail: rows[0].pending_official_email };
}

async transformEmail(userId: string) {
  const { rows } = await this.db.query<{
    pending_official_email: string | null;
    full_name: string;
    personal_email: string;
    temp_email: string | null;
  }>(
    'SELECT pending_official_email, full_name, personal_email, temp_email FROM users WHERE id = $1',
    [userId],
  );

  const user = rows[0];
  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  if (!user.pending_official_email) {
    throw new ConflictException(
      'No official email has been issued yet. Please wait for IT/HR to complete this step.',
    );
  }

  const { rows: emailTaken } = await this.db.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [user.pending_official_email, userId],
  );
  if (emailTaken.length > 0) {
    throw new ConflictException('This official email is already active on another account');
  }

  const { rows: updatedRows } = await this.db.query(
    `UPDATE users
     SET email = pending_official_email,
         pending_official_email = NULL,
         is_temp_email_active = false,
         must_change_password = true,
         updated_at = now()
     WHERE id = $1
     RETURNING email, full_name, personal_email, is_temp_email_active`,
    [userId],
  );
  const updated = updatedRows[0];

  // Force re-login everywhere — the login identifier itself just changed
  await this.revokeRefreshToken(userId);

  await this.mailService.sendEmailTransformed({
    id: userId,
    full_name: updated.full_name,
    personal_email: updated.personal_email,
    email: updated.email,
    is_temp_email_active: updated.is_temp_email_active,
  });

  return {
    message: 'Email transformed successfully. Please log in again with your official email.',
    officialEmail: updated.email,
  };
}
  
}