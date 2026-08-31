import { IsString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTemplateTaskDto } from './create-template-task.dto';

export class CreateTemplateDto {
  @IsUUID()
  department_id!: string;

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateTaskDto)
  tasks!: CreateTemplateTaskDto[];
}