import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Provider } from './s3.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Provider],
  exports: [S3Provider],
})
export class StorageModule {}