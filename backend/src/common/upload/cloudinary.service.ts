import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Image storage for uploads (org logos, product images, avatars) via Cloudinary.
 *
 * Configuration is read from the `CLOUDINARY_URL` env var
 * (cloudinary://<api_key>:<api_secret>@<cloud_name>) — the SDK picks it up
 * automatically. Uploads return a `secure_url` (https) which is stored as-is
 * and passed straight through by the controllers' `toPublicUrl` helpers.
 *
 * This replaces disk storage, which does not persist on Vercel's ephemeral
 * filesystem.
 */

const ROOT_FOLDER = 'molla-enterprise';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

@Injectable()
export class CloudinaryService {
  constructor() {
    // The SDK reads CLOUDINARY_URL from the environment automatically.
    cloudinary.config({ secure: true });
  }

  /**
   * Validates an uploaded image and stores it under `molla-enterprise/<folder>`,
   * returning its public https URL. `file` comes from multer's memory storage,
   * so `file.buffer` holds the bytes.
   */
  async uploadImage(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('File is empty');
    }
    if (!IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: JPG, PNG, WebP, GIF, AVIF, SVG.',
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('File too large. Max 5 MB.');
    }
    if (!process.env.CLOUDINARY_URL) {
      throw new InternalServerErrorException('CLOUDINARY_URL is not configured');
    }

    // Cloudinary's upload() accepts a base64 data URI.
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${ROOT_FOLDER}/${folder}`,
      resource_type: 'image',
    });

    return result.secure_url;
  }

  /** Deletes a previously uploaded image by its Cloudinary URL. No-op for other URLs. */
  async remove(url?: string | null): Promise<void> {
    if (!url) return;
    const publicId = this.publicIdFromUrl(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch {
      // Deleting the old asset is best-effort; never fail the request over it.
    }
  }

  /**
   * Extracts the public id from a Cloudinary URL, e.g.
   * https://res.cloudinary.com/<cloud>/image/upload/v123/molla-enterprise/products/x.jpg
   *   → molla-enterprise/products/x
   * Returns null for non-Cloudinary URLs (e.g. legacy `/uploads/...` paths).
   */
  private publicIdFromUrl(url: string): string | null {
    const match = url.match(
      /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/,
    );
    return match ? match[1] : null;
  }
}
