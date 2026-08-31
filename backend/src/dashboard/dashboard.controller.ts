import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('me')
  async getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getMyDashboard(user.userId);
  }
}
