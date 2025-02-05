import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { S3Module } from 'src/s3/s3.module';
import { DIDsController } from './dids.controller';
import { DIDsService } from './dids.service';
import { DID, DIDSchema } from './schemas/did.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: DID.name, schema: DIDSchema }]),
    S3Module,
  ],
  controllers: [DIDsController],
  providers: [DIDsService],
  exports: [DIDsService],
})
export class DIDsModule {}
