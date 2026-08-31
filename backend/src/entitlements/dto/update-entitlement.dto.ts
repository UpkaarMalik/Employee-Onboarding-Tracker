import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateEntitlementDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['INSURANCE', 'DEVICE', 'PERK', 'OTHER'])
  category?: 'INSURANCE' | 'DEVICE' | 'PERK' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
