import { Module } from '@nestjs/common';
 import { PassportModule } from '@nestjs/passport';
 import { JwtModule } from '@nestjs/jwt';
 import { ConfigService } from '@nestjs/config';

 @Module({
 imports: [
     PassportModule.register({ defaultStrategy: 'jwt' }),
     JwtModule.registerAsync({
     useFactory: (configService: ConfigService) => ({
         secret: configService.get<string>('JWT_SECRET'),
         signOptions: { expiresIn: '1d' },
     }),
     inject: [ConfigService],
     }),
 ],
 exports: [PassportModule, JwtModule],
 })
 export class SharedAuthModule {}