import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModeratePostDto {
  @IsIn(['HIDE', 'RESTORE'])
  action!: 'HIDE' | 'RESTORE';

  @IsOptional()
  @IsString()
  reason?: string;
}
