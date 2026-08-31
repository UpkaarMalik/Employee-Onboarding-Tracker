import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateEntitlementDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['INSURANCE', 'DEVICE', 'PERK', 'OTHER'])
  category!: 'INSURANCE' | 'DEVICE' | 'PERK' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
