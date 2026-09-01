import { IsIn } from 'class-validator';

export class ReactPostDto {
  @IsIn(['👍', 'Kudos', '👏'])
  reaction!: string;
}
