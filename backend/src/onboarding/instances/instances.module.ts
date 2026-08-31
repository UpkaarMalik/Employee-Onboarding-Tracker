import { Module } from '@nestjs/common';
import { InstancesController } from './instances.controller';
import { InstancesService } from './instances.service';
import { TemplatesModule } from '../templates/templates.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TemplatesModule,TasksModule],
  controllers: [InstancesController],
  providers: [InstancesService],
  exports: [InstancesService],
})
export class InstancesModule {}