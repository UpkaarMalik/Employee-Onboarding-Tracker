import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsObject()
  content_json?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  content_html?: string;
}
