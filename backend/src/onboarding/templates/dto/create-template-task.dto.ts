import { IsString, IsIn, IsBoolean, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateTemplateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['ACTION', 'READING'])
  task_type!: 'ACTION' | 'READING';

  @IsInt()
  order_index!: number;

  @IsIn(['EMPLOYEE', 'HR', 'DEPARTMENT_ADMIN'])
  owner_type!: 'EMPLOYEE' | 'HR' | 'DEPARTMENT_ADMIN';

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsInt()
  depends_on_order_index?: number;

  @IsOptional()
  @IsUUID()
  resource_id?: string;
}