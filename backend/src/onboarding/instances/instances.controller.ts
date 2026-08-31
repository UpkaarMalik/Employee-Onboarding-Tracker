import { Body, Controller, Get, Param, Post, Patch , NotFoundException} from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('onboarding/instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'HR')
  async create(@Body() dto: CreateInstanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.instancesService.createForEmployee(dto.employee_id, user.userId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'HR')
  async findAll() {
    return this.instancesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    return this.instancesService.findById(id);
  }
  @Patch(':id/cancel')
@Roles('SUPER_ADMIN', 'HR')
async cancel(@Param('id') id: string) {
  await this.instancesService.cancel(id);
  return { message: 'Onboarding instance cancelled' };
}

@Get('me')
async findMine(@CurrentUser() user: AuthenticatedUser) {
  const instance = await this.instancesService.findByEmployeeId(user.userId);
  if (!instance) {
    throw new NotFoundException('No onboarding instance found for this account');
  }
  return instance;
}

}