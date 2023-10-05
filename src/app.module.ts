import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { SSEModule } from './sse/sse.module';
import { DIDsModule } from './dids/dids.module';
import { S3Module } from './s3/s3.module';
import { ProtocolModule } from './protocol/protocol.module';
import { VCModule } from './vc/vc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.development'],
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    VCModule,
    SSEModule,
    AuthModule,
    DIDsModule,
    S3Module,
    ProtocolModule,
  ],
})
export class AppModule {}
