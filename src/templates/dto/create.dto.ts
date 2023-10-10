import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TemplateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => TemplateAttributeDto)
  value: string | number | TemplateAttributeDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  required: boolean;
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
