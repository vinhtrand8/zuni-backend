import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class SchemaSubmissionsInputDto {
  @ApiProperty()
  @IsNotEmpty()
  schemaId: string;
}

export class HolderSubmissionsInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  schemaIds: string[];
}
