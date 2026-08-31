import { IsString } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  category!: string;

  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}
