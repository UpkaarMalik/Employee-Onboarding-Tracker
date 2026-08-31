import { IsString, IsEmail, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsString()
  full_name!: string;

  @IsEmail()
  personal_email!: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsString()
  department_name?: string;

  @IsOptional()
  @IsString()
  department_code?: string;

  @IsDateString()
  joining_date!: string;
}