import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class S3Provider {
  private readonly logger = new Logger(S3Provider.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET_NAME')!;
    const region = this.config.get<string>('S3_REGION') || 'us-east-1';
    const endpoint = this.config.get<string>('S3_ENDPOINT');

    if (!this.bucket) {
        throw new Error('S3_BUCKET_NAME is not defined in environment variables');
    }

    this.s3 = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY')!,
        secretAccessKey: this.config.get('S3_SECRET_KEY')!,
      },
      forcePathStyle: true, // Needed for iDrive e2, MinIO, etc.
    });
  }

  /**
   * Uploads a file securely to S3.
   * @param fileBuffer The raw file buffer
   * @param mimeType The file mimetype (e.g. image/jpeg)
   * @param folder The folder path (e.g. 'kyc-documents')
   * @returns The S3 Key (path)
   */
  async uploadFile(fileBuffer: Buffer, mimeType: string, folder: string): Promise<string> {
    const key = `${folder}/${createId()}`;

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'private', // Strictly private
      }));

      this.logger.log(`File uploaded to S3: ${key}`);
      return key;
    } catch (error: any) {
      this.logger.error(`S3 Upload Error for ${key}: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload document securely.');
    }
  }

  /**
   * Generates a temporary, pre-signed URL to view a private object.
   * @param key The S3 Key
   * @param expiresInSeconds Duration the URL is valid (default 15 mins)
   */
  async getSignedUrlForView(key: string, expiresInSeconds = 900): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
    } catch (error: any) {
      this.logger.error(`S3 Signing Error for ${key}: ${error.message}`);
      throw new InternalServerErrorException('Could not generate secure access link.');
    }
  }
}