import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { PassportModule } from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import { envs } from 'src/config';
import { JwtStrategy } from './jwt.strategy';
import { DbModule } from 'src/db/db.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: envs.jwt_secret,
      signOptions: {expiresIn: envs.jwt_expires_in}
    }),
    DbModule
  ],
  exports: [
    AuthService
  ]
})
export class AuthModule {}
