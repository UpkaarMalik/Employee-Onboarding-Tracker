import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // temp_email OR official email — resolved in the service

  @IsString()
  @IsNotEmpty()
  password!: string;
}