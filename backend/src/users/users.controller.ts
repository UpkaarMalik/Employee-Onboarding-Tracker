import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetPendingEmailDto } from './dto/set-pending-email.dto';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly auditService:AuditService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'HR')
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, user.userId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'HR')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN')
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const before = await this.usersService.findById(id);
    const updated = await this.usersService.changeRole(id, dto.role);

    await this.auditService.log({
      actorId: actor.userId,
      eventType: 'ROLE_CHANGED',
      targetType: 'user',
      targetId: id,
      metadata: { from: before.role, to: dto.role },
    });

    // Role just changed — force re-login everywhere immediately
    await this.authService.revokeRefreshToken(id);

    return updated;
  }

  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateOwnProfile(user.userId, id, dto);
  }

  @Patch('me/complete-profile')
  async completeProfile(
    @Body() dto: CompleteProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.completeProfile(user.userId, dto);
  }

  @Patch(':id/set-pending-email')
@Roles('SUPER_ADMIN', 'ADMIN', 'HR')
async setPendingEmail(@Param('id') id: string, @Body() dto: SetPendingEmailDto) {
  return this.usersService.setPendingOfficialEmail(id, dto.official_email);
}


}