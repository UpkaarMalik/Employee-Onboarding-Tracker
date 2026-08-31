import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { DepartmentsService } from '../departments/departments.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { generateTempPassword } from './utils/generate-temp-password';

export interface UserRow {
  id: string;
  full_name: string;
  mobile: string | null;
  dob: string | null;
  address: string | null;
  personal_email: string;
  temp_email: string | null;
  email: string | null;
  pending_official_email: string | null;
  is_temp_email_active: boolean;
  role: string;
  department_id: string | null;
  profile_picture_url: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

const USER_PUBLIC_COLUMNS = `
  id, full_name, mobile, dob, address, personal_email, temp_email, email,
  pending_official_email, is_temp_email_active, role, department_id,
  profile_picture_url, joining_date, is_active, created_at
`;

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly departmentsService: DepartmentsService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateUserDto, createdByUserId: string): Promise<Omit<UserRow, 'password_hash'>> {
    const departmentId = await this.departmentsService.resolveDepartmentId({
      department_id: dto.department_id,
      department_name: dto.department_name,
      department_code: dto.department_code,
    });

    const { rows: existing } = await this.db.query(
      'SELECT id FROM users WHERE personal_email = $1',
      [dto.personal_email],
    );
    if (existing.length > 0) {
      throw new ConflictException('A user with this personal email already exists');
    }

    // Generate a temp login identifier from the person's name — simple,
    // readable, not guaranteed globally unique on its own, so we suffix
    // with a short random string to avoid collisions.
    const slug = dto.full_name.toLowerCase().replace(/[^a-z]/g, '.');
    const uniqueSuffix = Math.random().toString(36).slice(2, 6);
    const tempEmail = `${slug}.${uniqueSuffix}.temp@company.com`;

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { rows } = await this.db.query<UserRow>(
      `INSERT INTO users
        (full_name, personal_email, temp_email, is_temp_email_active,
         password_hash, must_change_password, role, department_id,
         joining_date, is_active, created_by)
       VALUES ($1, $2, $3, true, $4, true, 'EMPLOYEE', $5, $6, true, $7)
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      [
        dto.full_name,
        dto.personal_email,
        tempEmail,
        passwordHash,
        departmentId,
        dto.joining_date,
        createdByUserId,
      ],
    );

    const newUser = rows[0];

    await this.mailService.sendTempCredentials(
      {
        id: newUser.id,
        full_name: newUser.full_name,
        personal_email: newUser.personal_email,
        email: newUser.email,
        is_temp_email_active: newUser.is_temp_email_active,
      },
      tempEmail,
      tempPassword,
    );

    // TODO (Day 2): once onboarding_instances/tasks exist, trigger instance
    // creation here so the employee has their checklist ready on first login.

    return newUser;
  }

  async findAll(): Promise<UserRow[]> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT ${USER_PUBLIC_COLUMNS} FROM users ORDER BY created_at DESC`,
    );
    return rows;
  }

  async findById(id: string): Promise<UserRow> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    return rows[0];
  }

  async changeRole(targetUserId: string, newRole: string): Promise<UserRow> {
  const target = await this.findById(targetUserId);

  const { rows } = await this.db.query<UserRow>(
    `UPDATE users SET role = $1, updated_at = now()
     WHERE id = $2
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [newRole, targetUserId],
  );
  const updated = rows[0];

  await this.mailService.sendRoleChanged(
    {
      id: updated.id,
      full_name: updated.full_name,
      personal_email: updated.personal_email,
      email: updated.email,
      is_temp_email_active: updated.is_temp_email_active,
    },
    newRole,
  );

  return updated;
}

  async updateOwnProfile(
    currentUserId: string,
    requestedUserId: string,
    dto: UpdateProfileDto,
  ): Promise<UserRow> {
    if (currentUserId !== requestedUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(dto.address);
    }
    if (dto.profile_picture_url !== undefined) {
      fields.push(`profile_picture_url = $${paramIndex++}`);
      values.push(dto.profile_picture_url);
    }

    if (fields.length === 0) {
      return this.findById(requestedUserId);
    }

    fields.push(`updated_at = now()`);
    values.push(requestedUserId);

    const { rows } = await this.db.query<UserRow>(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      values,
    );
    return rows[0];
  }

  async completeProfile(userId: string, dto: CompleteProfileDto): Promise<UserRow> {
    const existing = await this.findById(userId);

    if (existing.mobile !== null) {
      throw new ConflictException(
        'Personal details have already been submitted and cannot be resubmitted here',
      );
    }

    const { rows } = await this.db.query<UserRow>(
      `UPDATE users SET mobile = $1, dob = $2, address = $3, updated_at = now()
       WHERE id = $4
       RETURNING ${USER_PUBLIC_COLUMNS}`,
      [dto.mobile, dto.dob, dto.address, userId],
    );

    // TODO (Day 2): once `tasks` exists, mark the "Complete Personal Details"
    // task COMPLETED for this user's onboarding instance here.

    return rows[0];
  }

  async setPendingOfficialEmail(userId: string, officialEmail: string): Promise<UserRow> {
  const user = await this.findById(userId);

  const { rows: emailTaken } = await this.db.query(
    'SELECT id FROM users WHERE email = $1',
    [officialEmail],
  );
  if (emailTaken.length > 0) {
    throw new ConflictException('This official email is already in use');
  }

  const { rows } = await this.db.query<UserRow>(
    `UPDATE users SET pending_official_email = $1, updated_at = now()
     WHERE id = $2
     RETURNING ${USER_PUBLIC_COLUMNS}`,
    [officialEmail, userId],
  );
  const updated = rows[0];

  await this.mailService.sendOfficialEmailReady(
    {
      id: updated.id,
      full_name: updated.full_name,
      personal_email: updated.personal_email,
      email: updated.email,
      is_temp_email_active: updated.is_temp_email_active,
    },
    officialEmail,
  );

  return updated;
}
}