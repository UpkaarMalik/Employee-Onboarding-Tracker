import { IsUUID } from 'class-validator';

export class CreateInstanceDto {
  @IsUUID()
  employee_id!: string;
}