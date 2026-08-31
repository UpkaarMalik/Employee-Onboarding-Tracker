import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SkipPasswordCheck } from '../common/decorators/skip-password-check.decorator';
import { Public } from '../common/decorators/public.decorator';
import { MailService } from '../mail/mail.service';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly mailService: MailService
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
@SkipPasswordCheck()
@HttpCode(HttpStatus.NO_CONTENT)
async logout(
  @CurrentUser() user: {
    userId: string;
    jti: string;
    exp: number;
  },
) {
  await this.authService.logout(
    user.userId,
    user.jti,
    user.exp,
  );
}

  @Patch('change-password')
  @SkipPasswordCheck()
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
    return { message: 'Password changed successfully. Please log in again.' };
  }

  @Get('test-admin-only')
@Roles('SUPER_ADMIN', 'ADMIN')
testAdminOnly() {
  return { message: 'You are an Admin or Super Admin' };
}

@Get('test-mail')
@Public()
async testMail() {
  await this.mailService.sendTempCredentials(
    {
      id: 'test-id',
      full_name: 'Test User',
      personal_email: 'test.random@example.com',
      email: null,
      is_temp_email_active: true,
    },
    'test.temp@company.com',
    'TempPass123!',
  );
  return { message: 'Check server console for Ethereal preview link' };
}
  
}