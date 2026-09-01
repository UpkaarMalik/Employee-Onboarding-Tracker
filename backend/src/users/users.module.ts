import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DepartmentsModule } from '../departments/departments.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { TasksModule } from '../onboarding/tasks/tasks.module';
import { InstancesModule } from '../onboarding/instances/instances.module';

@Module({
  imports: [DepartmentsModule, AuthModule, AuditModule, TasksModule, InstancesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}