import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

/**
 * Global so every feature module can inject CloudinaryService without importing
 * this module explicitly.
 */
@Global()
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
