import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['POLICY', 'HANDBOOK', 'PLAYBOOK', 'LEARNING'])
  category!: 'POLICY' | 'HANDBOOK' | 'PLAYBOOK' | 'LEARNING';

  @IsString()
  file_url!: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsBoolean()
  is_downloadable?: boolean;
}
