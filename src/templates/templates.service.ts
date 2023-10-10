import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTemplateDto } from './dto/create.dto';
import { Template, TemplateDocument } from './schemas/templates.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
  ) {}
  async createTemplate(
    createTemplateDto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    const createdTemplate = new this.templateModel(createTemplateDto);
    return await createdTemplate.save();
  }

  findAll(): Promise<TemplateDocument[]> {
    return this.templateModel.find().exec();
  }
}
