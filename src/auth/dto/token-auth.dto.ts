import { ApiResponseProperty } from '@nestjs/swagger';

export class TokenAuthDto {
  @ApiResponseProperty()
  accessToken: string;

  @ApiResponseProperty()
  wallet?: string;

  @ApiResponseProperty()
  did?: string;

  @ApiResponseProperty()
  privateKey?: string;
}
