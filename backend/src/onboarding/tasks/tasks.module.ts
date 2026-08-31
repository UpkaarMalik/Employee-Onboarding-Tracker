import { Module } from '@nestjs/common';
import { TaskStateService } from './task-state.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers:[TasksController],
  providers: [TaskStateService,TasksService],
  exports: [TaskStateService,TasksService],
})
export class TasksModule {}