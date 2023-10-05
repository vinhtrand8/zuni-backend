import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { ProofPurpose } from '../lib/credential';

export type DataSignatureDocument = HydratedDocument<DataSignature>;

@Schema()
export class DataSignature {
  @ApiResponseProperty()
  @Prop()
  type: string;

  @ApiResponseProperty()
  @Prop()
  created: string;

  @ApiResponseProperty()
  @Prop()
  proofPurpose: ProofPurpose;

  @ApiResponseProperty()
  @Prop()
  value: string;

  @ApiResponseProperty()
  @Prop()
  verificationMethod: string;

  constructor(data: DataSignature) {
    this.type = data.type;
    this.created = data.created;
    this.proofPurpose = data.proofPurpose;
    this.value = data.value;
    this.verificationMethod = data.verificationMethod;
  }
}

export const DataSignatureSchema = SchemaFactory.createForClass(DataSignature);
