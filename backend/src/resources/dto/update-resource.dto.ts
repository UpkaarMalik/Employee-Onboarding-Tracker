import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['POLICY', 'HANDBOOK', 'PLAYBOOK', 'LEARNING'])
  category?: 'POLICY' | 'HANDBOOK' | 'PLAYBOOK' | 'LEARNING';

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsBoolean()
  is_downloadable?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
