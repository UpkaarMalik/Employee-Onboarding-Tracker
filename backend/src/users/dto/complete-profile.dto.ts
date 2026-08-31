import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsDateString()
  dob!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;
}