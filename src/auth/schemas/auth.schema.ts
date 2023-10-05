import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type AuthDocument = HydratedDocument<Auth>;

@Schema({
  timestamps: true,
})
export class Auth {
  @ApiResponseProperty()
  @Prop({ unique: true })
  uuid: string;

  @ApiResponseProperty()
  @Prop()
  challenge: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
