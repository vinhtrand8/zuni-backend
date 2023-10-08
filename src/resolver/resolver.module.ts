import { Module } from '@nestjs/common';
import { ResolverController } from './resolver.controller';
import { IResolverService } from './interface.resolver.service';
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
