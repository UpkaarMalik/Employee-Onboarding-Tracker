import { Controller, Get } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('departments-summary')
  async departmentsSummary() {
    return this.companyService.getDepartmentsSummary();
  }
}
