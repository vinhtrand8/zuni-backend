import { Module } from '@nestjs/common';
import { VCService } from './vc.service';
import { VCController } from './vc.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import {
  CredentialSchema,
  Credential,
  DataSignatureSchema,
  DataSignature,
  FieldIndexSchema,
  FieldIndex,
  SchemaSchema,
  Schema,
  VCPresentationSchema,
  VCPresentation,
} from './schemas/vc.schema';
import { ProtocolModule } from 'src/protocol/protocol.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: FieldIndex.name, schema: FieldIndexSchema },
      { name: Credential.name, schema: CredentialSchema },
      { name: DataSignature.name, schema: DataSignatureSchema },
      {
        name: VCPresentation.name,
        schema: VCPresentationSchema,
      },
      { name: Schema.name, schema: SchemaSchema },
    ]),
    ProtocolModule,
  ],
  controllers: [VCController],
  providers: [VCService],
  exports: [VCService],
})
export class VCModule {}
