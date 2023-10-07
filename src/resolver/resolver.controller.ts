import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
} from '@nestjs/common';
import { IResolverService } from './resolver.interface.service';

@Controller('resolver')
export class ResolverController {
  constructor(
    @Inject(IResolverService) private readonly service: IResolverService,
  ) {}

  @Get(':did')
  async fetchDIDDocument(@Param('did') did: string) {
    try {
      const data = await this.service.fetchDIDDocument(did);
      if (!data) {
        return { error: 'No DID Document found' };
      }
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
