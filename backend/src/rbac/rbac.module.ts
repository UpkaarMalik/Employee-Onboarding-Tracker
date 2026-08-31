import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { AppAuthGuard } from '../common/guards/app-auth.guard';

@Global()
@Module({
  imports: [AuthModule, JwtModule.register({})],
  providers: [{ provide: APP_GUARD, useClass: AppAuthGuard }],
})
export class RbacModule {}