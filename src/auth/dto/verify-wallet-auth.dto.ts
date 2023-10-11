import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty()
  @IsObject()
  @IsOptional()
  extra: Record<string, unknown>;
}
