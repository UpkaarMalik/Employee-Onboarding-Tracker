import { IsString } from 'class-validator';

export class ReactPostDto {
  @IsString()
  reaction!: string;
}
