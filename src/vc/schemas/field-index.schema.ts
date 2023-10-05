import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';

export type FieldIndexDocument = HydratedDocument<FieldIndex>;

@Schema()
export class FieldIndex {
  @ApiResponseProperty()
  @Prop()
  fieldName: string;

  @ApiResponseProperty()
  @Prop()
  fieldIndex: number;

  constructor(data: FieldIndex) {
    this.fieldName = data.fieldName;
    this.fieldIndex = data.fieldIndex;
  }
}
export const FieldIndexSchema = SchemaFactory.createForClass(FieldIndex);
