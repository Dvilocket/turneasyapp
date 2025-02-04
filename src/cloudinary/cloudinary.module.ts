import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { envs } from 'src/config';

@Module({
  providers: [
    {
      provide: 'CLOUDINARY',
      useFactory: () => {
        return cloudinary.config({
          cloud_name: envs.cloudinary_cloud_name,
          api_key: envs.cloudinary_api_key,
          api_secret: envs.cloudinary_api_secret,
        });
      },
    },
    CloudinaryService,
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
