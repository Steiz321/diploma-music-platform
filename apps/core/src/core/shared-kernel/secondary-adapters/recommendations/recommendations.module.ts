import { Global, Module } from '@nestjs/common';
import { RecommendationsServiceInterfaceType } from '../../ports/recommendations-service.interface';
import { HttpRecommendationsService } from './http-recommendations.service';

@Global()
@Module({
  providers: [
    {
      provide: RecommendationsServiceInterfaceType,
      useClass: HttpRecommendationsService,
    },
  ],
  exports: [RecommendationsServiceInterfaceType],
})
export class RecommendationsModule {}
