import { IsEmail } from 'class-validator';

export class SetPendingEmailDto {
  @IsEmail()
  official_email: string;
}