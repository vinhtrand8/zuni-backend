import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class VerifyDIDAuthDto {
  @ApiProperty()
  @IsString()
  uuid: string;

  @ApiProperty()
  @IsString()
  did: string;

  @ApiProperty()
  @IsString()
  authenticationId: string;

  @ApiProperty()
  @IsString()
  signature: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  extra: Record<string, unknown>;
}
