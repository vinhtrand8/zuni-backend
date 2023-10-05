import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyDIDAuthDto {
  @ApiProperty()
  @IsString()
  uuid: string;

  @ApiProperty()
  @IsString()
  wallet: string;

  @ApiProperty()
  @IsString()
  did: string;

  @ApiProperty()
  @IsString()
  encryptedPrivKey: string;

  @ApiProperty()
  @IsString()
  signature: string;
}
