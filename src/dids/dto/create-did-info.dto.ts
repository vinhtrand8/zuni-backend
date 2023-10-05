import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDIDInfoDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty()
  @IsString()
  description: string;
}
