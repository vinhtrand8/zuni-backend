import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TemplateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => TemplateAttributeDto)
  value: string | number | TemplateAttributeDto;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1) // At least one attribute should be provided
  @ValidateNested({ each: true })
  @Type(() => TemplateAttributeDto)
  attributes: TemplateAttributeDto[];
}
