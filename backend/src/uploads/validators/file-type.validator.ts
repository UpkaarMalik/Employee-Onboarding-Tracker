import { BadRequestException } from '@nestjs/common';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateImageUpload(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException(
      `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException('File exceeds the 5MB size limit');
  }
}
