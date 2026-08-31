import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsObject()
  content_json!: Record<string, unknown>;

  @IsString()
  content_html!: string;
}
