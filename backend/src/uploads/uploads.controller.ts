import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';
import { UsersService } from '../users/users.service';
import { validateImageUpload } from './validators/file-type.validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    validateImageUpload(file);
    const url = await this.uploadsService.uploadFile('profile-pictures', file);
    await this.usersService.updateOwnProfile(user.userId, user.userId, {
      profile_picture_url: url,
    });
    return { url };
  }

  @Post('content-gallery')
  @Permissions('content.manage')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadContentGalleryImage(@UploadedFile() file: Express.Multer.File) {
    validateImageUpload(file);
    const url = await this.uploadsService.uploadFile('content-gallery', file);
    return { url };
  }
}
