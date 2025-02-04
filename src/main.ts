import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Main-Api');

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    })
   );

  await app.listen(envs.port_app ?? 3000);
  logger.log(`Main-Api running on port ${envs.port_app}`);

}
bootstrap();
