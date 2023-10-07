import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly objectBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const { region, bucketName, accessKeyId, secretAccessKey } =
      configService.getOrThrow<S3Config>('s3');

    this.objectBaseUrl = `https://${bucketName}.s3.amazonaws.com`;

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(fileName: string, fileContent: Buffer) {
    try {
      const params = {
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
        Key: fileName,
        Body: fileContent,
        ACL: 'public-read',
      };
      await this.s3Client.send(new PutObjectCommand(params));

      return `${this.objectBaseUrl}/${encodeURIComponent(fileName)}`;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
