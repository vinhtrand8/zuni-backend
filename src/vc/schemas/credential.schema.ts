import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { DataSignatureInterface, FieldIndexInterface } from '../lib/credential';
import { FieldIndex, FieldIndexSchema } from './field-index.schema';
import { DataSignature, DataSignatureSchema } from './data-signature.schema';

export type CredentialDocument = HydratedDocument<Credential>;

@Schema()
export class Credential {
  @ApiResponseProperty()
  @Prop()
  id: string;

  @ApiResponseProperty()
  @Prop({ type: [String] })
  types: string[];

  @ApiResponseProperty()
  @Prop()
  issuer: string; // did

  @ApiResponseProperty()
  @Prop()
  issuerPublicKey: string; // public key with prefix

  @ApiResponseProperty()
  @Prop()
  holder: string; // did

  @ApiResponseProperty()
  @Prop()
  holderPublicKey: string; // public key with prefix

  @ApiResponseProperty()
  @Prop()
  issuanceDate: string;

  @ApiResponseProperty()
  @Prop()
  expirationDate?: string;

  @ApiResponseProperty()
  @Prop({ type: [FieldIndexSchema] })
  fieldIndexes: FieldIndexInterface[];

  @ApiResponseProperty()
  @Prop()
  fieldMerkleRoot: string;

  @ApiResponseProperty()
  @Prop()
  encryptedData: string;

  @ApiResponseProperty()
  @Prop({ type: DataSignatureSchema })
  proof: DataSignatureInterface;

  constructor(data: Credential) {
    this.id = data.id;
    this.types = data.types;
    this.issuer = data.issuer;
    this.issuerPublicKey = data.issuerPublicKey;
    this.holder = data.holder;
    this.holderPublicKey = data.holderPublicKey;
    this.issuanceDate = data.issuanceDate;
    this.expirationDate = data.expirationDate;
    this.fieldIndexes = data.fieldIndexes.map(
      (fieldIndex) => new FieldIndex(fieldIndex),
    );
    this.fieldMerkleRoot = data.fieldMerkleRoot;
    this.encryptedData = data.encryptedData;
    this.proof = new DataSignature(data.proof);
  }
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);
