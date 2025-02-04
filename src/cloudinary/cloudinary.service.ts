import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: any) {}

  async uploadImage(file: Express.Multer.File): Promise<string[]> {
    const result = await cloudinary.uploader.upload(file.path);
    return [
      result.secure_url,
      result.public_id,
      result.format
    ];
  }
}