import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingUpdate } from './entities/tracking-update.entity';
import { Route } from '../routes/entities/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingUpdate, Route])],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
