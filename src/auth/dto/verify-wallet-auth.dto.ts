import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyWalletAuthDto {
  @ApiProperty()
  @IsString()
  uuid: string;

  @ApiProperty()
  @IsString()
  wallet: string;

  @ApiProperty()
  @IsString()
  signature: string;
}
