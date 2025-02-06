import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: any) {}

  /**
   * Función para subir una imagen
   * @param file 
   * @returns 
   */
  async uploadImage(file: Express.Multer.File): Promise<string[]> {
    const result = await cloudinary.uploader.upload(file.path);
    return [
      result.secure_url,
      result.public_id,
      result.format
    ];
  }


  /**
   * Función para eliminar una imagen
   * @param idImage 
   * @returns 
   */
  async deleteImage(idImage: string) {

    if (!idImage || typeof idImage !== 'string') {
      throw new HttpException('Invalid image ID', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await cloudinary.uploader.destroy(idImage);
      return result;
    } catch(error) {
      throw new HttpException('Failed to delete image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}