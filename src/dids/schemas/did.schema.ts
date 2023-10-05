import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type DIDDocument = HydratedDocument<DID>;

@Schema()
export class DID {
  @ApiResponseProperty()
  @Prop({ unique: true })
  did: string;

  @ApiResponseProperty()
  @Prop()
  wallet: string;

  @ApiResponseProperty()
  @Prop()
  name: string;

  @ApiResponseProperty()
  @Prop()
  symbol: string;

  @ApiResponseProperty()
  @Prop()
  description: string;

  @ApiResponseProperty()
  @Prop()
  logo: string;

  @ApiResponseProperty()
  @Prop({ default: [] })
  trustedDIDs: string[];
}

export const DIDSchema = SchemaFactory.createForClass(DID);
