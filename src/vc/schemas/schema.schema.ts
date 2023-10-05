import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { DataSignatureInterface } from '../lib/credential';
import { DataSignature, DataSignatureSchema } from './data-signature.schema';

export type SchemaDocument = HydratedDocument<Schema>;

@SchemaDecorator()
export class Schema {
  @ApiResponseProperty()
  @Prop({ unique: true })
  id: string;

  @ApiResponseProperty()
  @Prop()
  name: string; // name of schema

  @ApiResponseProperty()
  @Prop()
  verifier: string; // DID

  @ApiResponseProperty()
  @Prop()
  checks: any[];

  @ApiResponseProperty()
  @Prop({ type: [String] })
  requests: string[];

  @ApiResponseProperty()
  @Prop({ type: [String] })
  checkMerkleRoots: string[];

  @ApiResponseProperty()
  @Prop({ type: DataSignatureSchema })
  proof: DataSignatureInterface;

  @ApiResponseProperty()
  @Prop()
  issuanceDate: string; // public key with prefix

  @ApiResponseProperty()
  @Prop()
  verifierPublicKey?: string; // public key with prefix

  constructor(data: Schema) {
    this.id = data.id;
    this.name = data.name;
    this.verifier = data.verifier;
    this.checks = data.checks;
    this.requests = data.requests;
    this.checkMerkleRoots = data.checkMerkleRoots;
    this.issuanceDate = data.issuanceDate;
    this.verifierPublicKey = data.verifierPublicKey;
    this.proof = new DataSignature(data.proof);
  }
}

export const SchemaSchema = SchemaFactory.createForClass(Schema);
