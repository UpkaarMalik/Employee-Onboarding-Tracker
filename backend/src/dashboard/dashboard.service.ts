import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompanyService } from '../company/company.service';
import { InstancesService } from '../onboarding/instances/instances.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly companyService: CompanyService,
    private readonly instancesService: InstancesService,
  ) {}

  async getMyDashboard(userId: string) {
    const [onboarding, departments, statusBreakdown] = await Promise.all([
      this.instancesService.findByEmployeeId(userId),
      this.companyService.getDepartmentsSummary(),
      this.getStatusBreakdown(),
    ]);

    return {
      onboarding,
      company: { departments, statusBreakdown },
    };
  }

  private async getStatusBreakdown(): Promise<{ status: string; count: number }[]> {
    const { rows } = await this.db.query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM onboarding_instances GROUP BY status',
    );
    return rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }));
  }
}
