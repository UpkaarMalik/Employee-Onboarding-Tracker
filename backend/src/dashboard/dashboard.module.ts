import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CompanyModule } from '../company/company.module';
import { InstancesModule } from '../onboarding/instances/instances.module';

@Module({
  imports: [CompanyModule, InstancesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
