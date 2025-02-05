import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiResponseProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

interface ITemplateAttribute {
  name: string;
  value: string | number | boolean | ITemplateAttribute;
}

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ _id: true })
export class Template {
  @ApiResponseProperty()
  @Prop()
  name: string;

  @ApiResponseProperty()
  @Prop()
  description: string;

  @ApiResponseProperty()
  @Prop()
  attributes: ITemplateAttribute[];
}

const TemplateSchema = SchemaFactory.createForClass(Template);

export { TemplateSchema };
