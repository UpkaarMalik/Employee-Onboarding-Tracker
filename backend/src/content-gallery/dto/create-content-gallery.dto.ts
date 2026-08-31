import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateContentGalleryDto {
  @IsIn(['COMPANY_FAMILY', 'SPORTS'])
  type!: 'COMPANY_FAMILY' | 'SPORTS';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  image_url!: string;
}
