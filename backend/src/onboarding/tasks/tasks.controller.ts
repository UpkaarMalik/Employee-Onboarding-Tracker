import { Controller, Get, Query, Param, Patch, Body, } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TaskStateService, RawTaskRow } from './task-state.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { TasksService } from './tasks.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReassignTaskDto } from './dto/reassign-task.dto';



interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly db: DatabaseService,
    private readonly taskStateService: TaskStateService,
    private readonly tasksService: TasksService,
  ) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'HR')
  async findByInstance(@Query('instanceId') instanceId: string) {
    const { rows } = await this.db.query<RawTaskRow>(
      'SELECT * FROM tasks WHERE onboarding_instance_id = $1 ORDER BY order_index',
      [instanceId],
    );
    return this.taskStateService.attachEffectiveStateBatch(rows);
  }

  @Patch(':id/start')
  async start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.start(id, user.userId, user.role);
  }

  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.complete(id, user.userId, user.role, dto.official_email);
  }

  @Get(':id/history')
  async history(@Param('id') id: string) {
    return this.tasksService.getHistory(id);
  }

  @Patch(':id/reassign')
@Roles('SUPER_ADMIN', 'ADMIN', 'HR')
async reassign(
  @Param('id') id: string,
  @Body() dto: ReassignTaskDto,
  @CurrentUser() user: AuthenticatedUser,
) {
  return this.tasksService.reassign(id, dto.new_owner_id, user.userId, user.role);
}
}