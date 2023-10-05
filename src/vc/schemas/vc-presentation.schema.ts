import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { CredentialInterface, DataSignatureInterface } from '../lib/credential';
import { SchemaInterface } from '../lib/schema';
import { Credential, CredentialSchema } from './credential.schema';
import { Schema, SchemaSchema } from './schema.schema';
import { DataSignature, DataSignatureSchema } from './data-signature.schema';

export type VCPresentationDocument = HydratedDocument<VCPresentation>;

export enum SubmissionStatus {
  VERIFIED = 'VERIFIED',
  NOT_VERIFIED = 'NOT_VERIFIED',
  REJECTED = 'REJECTED',
}
@SchemaDecorator()
export class VCPresentation {
  @ApiResponseProperty()
  @Prop({ unique: true })
  id: string;

  @ApiResponseProperty()
  @Prop()
  holder: string; // DID

  @ApiResponseProperty()
  @Prop({ type: [CredentialSchema] })
  credentials: CredentialInterface[];

  @ApiResponseProperty()
  @Prop({ type: SchemaSchema })
  schema: SchemaInterface;

  @ApiResponseProperty()
  @Prop()
  encryptedData: string;

  @ApiResponseProperty()
  @Prop({ type: JSON })
  snarkProof: any;

  @ApiResponseProperty()
  @Prop({ type: DataSignatureSchema })
  proof: DataSignatureInterface;

  @ApiResponseProperty()
  @Prop({ enum: SubmissionStatus, default: SubmissionStatus.NOT_VERIFIED })
  status: SubmissionStatus;

  constructor(data: VCPresentation) {
    this.id = data.id;
    this.holder = data.holder;
    this.credentials = data.credentials.map(
      (credential) => new Credential(credential),
    );
    this.schema = new Schema(data.schema);
    this.encryptedData = data.encryptedData;
    this.snarkProof = data.snarkProof;
    this.proof = new DataSignature(data.proof);
    this.status = SubmissionStatus.NOT_VERIFIED;
  }
}

export const VCPresentationSchema =
  SchemaFactory.createForClass(VCPresentation);
