import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuditEventType } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(
    @Query('eventType') eventType?: AuditEventType,
    @Query('actorId') actorId?: string,
  ) {
    return this.auditService.findAll({ eventType, actorId });
  }
}