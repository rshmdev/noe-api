import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateRouteDto } from './dto/update-route.dto';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateRouteDto, @Req() req) {
    return this.routesService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAllAvailable(@Query() query) {
    return this.routesService.findAllAvailable(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto, @Req() req) {
    return this.routesService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('mine')
  getMyRoutes(@Req() req) {
    return this.routesService.listMyRoutes(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/start')
  start(@Param('id') id: string, @Req() req) {
    return this.routesService.startRoute(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req) {
    return this.routesService.completeRoute(id, req.user);
  }
}
