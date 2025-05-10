import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackingUpdate } from './entities/tracking-update.entity';
import { Repository } from 'typeorm';
import { CreateTrackingUpdateDto } from './dto/create-tracking-update.dto';
import { Route } from '../routes/entities/route.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingUpdate)
    private trackingRepo: Repository<TrackingUpdate>,
    @InjectRepository(Route)
    private routeRepo: Repository<Route>,
  ) {}

  async create(routeId: string, dto: CreateTrackingUpdateDto, user: User) {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['transportador'],
    });

    if (!route || route.transportador.id !== user.id) {
      throw new UnauthorizedException('Você não pode atualizar esta rota');
    }

    const update = this.trackingRepo.create({
      route,
      ...dto,
    });

    return this.trackingRepo.save(update);
  }

  async getLatest(routeId: string, user: User) {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['transportador'],
    });

    if (!route) throw new NotFoundException('Rota não encontrada');

    const update = await this.trackingRepo.findOne({
      where: { route },
      order: { createdAt: 'DESC' },
    });

    return {
      latest: update,
      route,
      transportador: route.transportador,
      paradas: route.stops,
    };
  }
}
