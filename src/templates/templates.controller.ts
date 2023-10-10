import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create.dto';
import { TemplateService } from './templates.service';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  createTemplate(@Body(ValidationPipe) createTemplateDto: CreateTemplateDto) {
    return this.templateService.createTemplate(createTemplateDto);
  }

  @Get()
  async findAll() {
    return await this.templateService.findAll();
  }
}
