import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrackingService } from './tracking.service';
import { CreateTrackingUpdateDto } from './dto/create-tracking-update.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post(':routeId')
  updatePosition(
    @Param('routeId') routeId: string,
    @Body() dto: CreateTrackingUpdateDto,
    @Req() req,
  ) {
    return this.trackingService.create(routeId, dto, req.user);
  }

  @Get(':routeId')
  getTracking(@Param('routeId') routeId: string, @Req() req) {
    return this.trackingService.getLatest(routeId, req.user);
  }
}
