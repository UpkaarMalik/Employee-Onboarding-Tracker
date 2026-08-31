import { Module } from '@nestjs/common';
import { ContentGalleryController } from './content-gallery.controller';
import { ContentGalleryService } from './content-gallery.service';

@Module({
  controllers: [ContentGalleryController],
  providers: [ContentGalleryService],
  exports: [ContentGalleryService],
})
export class ContentGalleryModule {}
