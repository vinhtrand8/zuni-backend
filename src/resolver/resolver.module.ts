import { Module } from '@nestjs/common';
import { IResolverService } from './interface.resolver.service';
import { ResolverController } from './resolver.controller';
import { SolanaService } from './solana.service';

@Module({
  controllers: [ResolverController],
  providers: [
    {
      provide: IResolverService,
      useClass: SolanaService,
    },
  ],
  exports: [
    {
      provide: IResolverService,
      useClass: SolanaService,
    },
  ],
})
export class ResolverModule {}
