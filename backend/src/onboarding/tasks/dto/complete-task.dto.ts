import { IsEmail, IsOptional } from 'class-validator';

export class CompleteTaskDto {
  // Only required when completing the "Company Email ID Issuance" task —
  // validated conditionally in the service, not via a class-validator
  // decorator, since it's task-specific rather than a fixed schema.
  @IsOptional()
  @IsEmail()
  official_email?: string;
}