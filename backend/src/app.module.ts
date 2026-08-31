import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { MailModule } from './mail/mail.module';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { TemplatesModule } from './onboarding/templates/templates.module';
import { InstancesModule } from './onboarding/instances/instances.module';
import { TasksModule } from './onboarding/tasks/tasks.module';
import { ReadingModule } from './onboarding/reading/reading.module';
import { NotesModule } from './notes/notes.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    AuthModule,
    RbacModule,
    MailModule,
    DepartmentsModule,
    UsersModule,
    AuditModule,
    TemplatesModule,
    InstancesModule,
    TasksModule,
    ReadingModule,
    NotesModule,
    EntitlementsModule,
    UploadsModule,
    NotificationsModule,
    ResourcesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
