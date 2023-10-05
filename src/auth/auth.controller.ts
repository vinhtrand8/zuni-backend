import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from './schemas/auth.schema';
import { AuthService } from './auth.service';
import { TokenAuthDto } from './dto/token-auth.dto';
import { VerifyDIDAuthDto } from './dto/verify-did-auth.dto';
import { VerifyWalletAuthDto } from './dto/verify-wallet-auth.dto';
import { SSEService } from 'src/sse/sse.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sseService: SSEService,
  ) {}

  @ApiOkResponse({
    type: Auth,
  })
  @Post('request')
  async requestAuth(): Promise<Auth> {
    try {
      const requestAuth = await this.authService.requestAuth();
      return requestAuth;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: TokenAuthDto,
  })
  @Post('wallets')
  async verifyWalletAuth(
    @Body() verifyWalletAuthDto: VerifyWalletAuthDto,
  ): Promise<TokenAuthDto> {
    try {
      const { uuid } = verifyWalletAuthDto;
      const tokenAuth = await this.authService.verifyWalletAuth(
        verifyWalletAuthDto,
      );
      await this.authService.removeRequestAuthByUuid(uuid);

      return tokenAuth;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: TokenAuthDto,
  })
  @Post('dids')
  async verifyDIDAuth(
    @Body() verifyDIDAuthDto: VerifyDIDAuthDto,
  ): Promise<TokenAuthDto> {
    try {
      const { uuid } = verifyDIDAuthDto;
      const tokenAuth = await this.authService.verifyDIDAuth(verifyDIDAuthDto);
      this.authService.removeRequestAuthByUuid(uuid); // not waiting for this to finish

      this.sseService.emitEvent(uuid, tokenAuth);

      return tokenAuth;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
