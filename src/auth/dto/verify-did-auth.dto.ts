import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
  @IsString()
  privateKey: string;
}
