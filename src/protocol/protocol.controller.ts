import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ProtocolInterface } from './protocol.interface';
import { SolanaService } from './solana.service';

@Controller('protocol')
export class ProtocolController {
  private service: ProtocolInterface;
  constructor() {
    // TODO: read const protocol = process.env.PROTOCOL;
    const protocol = 'solana';
    switch (protocol) {
      case 'solana':
        this.service = new SolanaService();
        break;
      default:
        throw new BadRequestException('Protocol not supported');
    }
  }

  @Get(':did')
  async getDIDDocument(@Param('did') did: string) {
    try {
      const data = await this.service.getDIDDocument(did);
      if (!data) {
        return { error: 'No DID Document found' };
      }
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
