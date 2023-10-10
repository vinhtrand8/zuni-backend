import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ResolverModule } from 'src/resolver/resolver.module';
import {
  DataSignatureModel,
  DataSignatureMongooseSchema,
  FieldIndexModel,
  FieldIndexMongooseSchema,
  PublicCredentialModel,
  PublicCredentialMongooseSchema,
  SchemaCredentialCheckModel,
  SchemaCredentialCheckMongooseSchema,
  SchemaModel,
  SchemaMongooseSchema,
  SingleCredentialFieldValidationPublicInputModel,
  SingleCredentialFieldValidationPublicInputMongooseSchema,
  SingleCredentialFieldValidationSnarkProofModel,
  SingleCredentialFieldValidationSnarkProofMongooseSchema,
  VCPresentationModel,
  VCPresentationMongooseSchema,
} from './schemas/VCModels';
import { VCController } from './vc.controller';
import { VCService } from './vc.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: FieldIndexModel.name, schema: FieldIndexMongooseSchema },
      { name: DataSignatureModel.name, schema: DataSignatureMongooseSchema },
      {
        name: PublicCredentialModel.name,
        schema: PublicCredentialMongooseSchema,
      },
      {
        name: SchemaCredentialCheckModel.name,
        schema: SchemaCredentialCheckMongooseSchema,
      },
      { name: SchemaModel.name, schema: SchemaMongooseSchema },
      {
        name: SingleCredentialFieldValidationPublicInputModel.name,
        schema: SingleCredentialFieldValidationPublicInputMongooseSchema,
      },
      {
        name: SingleCredentialFieldValidationSnarkProofModel.name,
        schema: SingleCredentialFieldValidationSnarkProofMongooseSchema,
      },
      { name: VCPresentationModel.name, schema: VCPresentationMongooseSchema },
    ]),
    ResolverModule,
  ],
  controllers: [VCController],
  providers: [VCService],
  exports: [VCService],
})
export class VCModule {}
