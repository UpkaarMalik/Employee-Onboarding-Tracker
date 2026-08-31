import { ArrayMinSize, IsArray, IsString, MaxLength } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @MaxLength(300)
  question!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options!: string[];
}
