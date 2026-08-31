import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { MailableUser } from './types';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private fromAddress = '"Company Onboarding" <no-reply@company.com>';

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production' && process.env.MAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });
      this.logger.log('Mail transporter configured for production SMTP.');
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(
        `Ethereal test account ready. Preview links will be logged for every send.`,
      );
    }
  }

  /**
   * Single routing function every send call must go through.
   * Pre-transform: only personal_email is reachable.
   * Post-transform: official email becomes the active channel; personal_email
   * is never touched again by any send call from this point on.
   */
  private getPreferredEmail(user: MailableUser): string {
    if (user.is_temp_email_active === false && user.email) {
      return user.email;
    }
    return user.personal_email;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 Email sent to ${to} — preview: ${previewUrl}`);
      } else {
        this.logger.log(`📧 Email sent to ${to} (subject: "${subject}")`);
      }
    } catch (err) {
      // Never let a mail failure block the triggering request.
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  // ── Pre-transform only — always personal_email ──────────────────────────

  async sendTempCredentials(
    user: MailableUser,
    tempEmail: string,
    tempPassword: string,
  ): Promise<void> {
    await this.send(
      user.personal_email,
      'Welcome — Your temporary login credentials',
      `
        <p>Hi ${user.full_name},</p>
        <p>Your account has been created. Use these credentials to log in for the first time:</p>
        <p><strong>Login:</strong> ${tempEmail}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>You'll be asked to set a new password on first login.</p>
      `,
    );
  }

  async sendOfficialEmailReady(user: MailableUser, officialEmail: string): Promise<void> {
    await this.send(
      user.personal_email,
      'Your official company email is ready',
      `
        <p>Hi ${user.full_name},</p>
        <p>Your official company email has been issued: <strong>${officialEmail}</strong></p>
        <p>Log in to your onboarding dashboard to activate it.</p>
      `,
    );
  }

  // ── Dynamically routed via getPreferredEmail() ───────────────────────────

  async sendEmailTransformed(user: MailableUser): Promise<void> {
    const to = this.getPreferredEmail(user);
    await this.send(
      to,
      'Your email has been activated',
      `
        <p>Hi ${user.full_name},</p>
        <p>Your official company email is now active: <strong>${user.email}</strong></p>
        <p>Please log in using this address going forward.</p>
      `,
    );
  }

  async sendRoleChanged(user: MailableUser, newRole: string): Promise<void> {
    const to = this.getPreferredEmail(user);
    await this.send(
      to,
      'Your account role has changed',
      `
        <p>Hi ${user.full_name},</p>
        <p>Your account role has been updated to: <strong>${newRole}</strong></p>
        <p>If you did not expect this change, please contact HR immediately.</p>
      `,
    );
  }

  async sendPasswordChanged(user: MailableUser): Promise<void> {
    const to = this.getPreferredEmail(user);
    await this.send(
      to,
      'Your password was changed',
      `
        <p>Hi ${user.full_name},</p>
        <p>This is a confirmation that your account password was just changed.</p>
        <p>If you did not make this change, please contact HR immediately.</p>
      `,
    );
  }
}