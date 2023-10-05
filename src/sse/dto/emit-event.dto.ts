import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class EmitEventDto {
  @ApiProperty()
  @IsString()
  uuid: string;

  @ApiProperty()
  @IsObject()
  data: object;
}
