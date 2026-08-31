import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('reports')
@Permissions('reports.read')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('onboarding-funnel')
  async onboardingFunnel() {
    return this.reportsService.getOnboardingFunnel();
  }

  // Overrides the class-level 'reports.read' requirement (empty array short-
  // circuits the guard's permission check) — the Company page embeds this
  // chart for all employees, not just Admin/HR/Super Admin.
  @Permissions()
  @Get('onboarding-trend')
  async onboardingTrend(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('departmentIds') departmentIds?: string,
  ) {
    const ids = departmentIds ? departmentIds.split(',').filter(Boolean) : undefined;
    return this.reportsService.getOnboardingTrend(from, to, ids);
  }

  @Get('task-overdue')
  async taskOverdue() {
    return this.reportsService.getTaskOverdue();
  }

  @Get('feedback-summary')
  async feedbackSummary() {
    return this.reportsService.getFeedbackSummary();
  }
}
