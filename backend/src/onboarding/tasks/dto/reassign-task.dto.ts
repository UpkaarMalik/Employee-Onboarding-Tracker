import { IsUUID } from 'class-validator';

export class ReassignTaskDto {
  @IsUUID()
  new_owner_id!: string;
}