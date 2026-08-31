import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

function sendCsv(res: Response, filename: string, csv: string): void {
  res.set({
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(csv);
}

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('onboardings.csv')
  async onboardings(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.exportsService.exportOnboardings(user);
    sendCsv(res, 'onboardings.csv', csv);
  }

  @Get('tasks.csv')
  async tasks(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.exportsService.exportTasks(user);
    sendCsv(res, 'tasks.csv', csv);
  }

  @Get('feedback.csv')
  async feedback(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.exportsService.exportFeedback(user);
    sendCsv(res, 'feedback.csv', csv);
  }
}
