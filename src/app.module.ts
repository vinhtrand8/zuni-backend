import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import configuration from 'src/config/configuration';
import { DIDsModule } from 'src/dids/dids.module';
import { ResolverModule } from 'src/resolver/resolver.module';
import { S3Module } from 'src/s3/s3.module';
import { SSEModule } from 'src/sse/sse.module';
import { VCModule } from 'src/vc/vc.module';
import { TemplateModule } from './templates/templates.module';

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
    ResolverModule,
    TemplateModule,
  ],
})
export class AppModule {}
