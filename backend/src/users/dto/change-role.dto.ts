import { IsIn } from 'class-validator';

export class ChangeRoleDto {
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'HR', 'EMPLOYEE'])
  role!: 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'EMPLOYEE';
}