import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { User } from '../users/entities/user.entity';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Stop } from './entities/stop.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routeRepo: Repository<Route>,

    @InjectRepository(Stop)
    private stopRepo: Repository<Stop>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateRouteDto, user: User) {
    if (user.role !== 'TRANSPORTER') {
      throw new UnauthorizedException(
        'Apenas transportadores podem criar rotas',
      );
    }

    const dbUser = await this.userRepo.findOne({ where: { id: user.id } });

    if (!dbUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const baseRoute = this.routeRepo.create({
      ...createDto,
      speciesAccepted: createDto.speciesAccepted.join(', '),
      animalSizeAccepted: createDto.animalSizeAccepted.join(', '),
      status: 'available',
      transportador: dbUser,
      createdAt: new Date(),
    });

    const savedRoute = await this.routeRepo.save(baseRoute);

    const stops = createDto.stops.map((stop) => {
      const newStop = new Stop();
      newStop.location = stop.location;
      newStop.arrivalTime = new Date(stop.arrivalTime);
      newStop.departureTime = new Date(stop.departureTime);
      newStop.notes = stop.notes || '';
      newStop.route = savedRoute;
      return newStop;
    });

    await this.stopRepo.save(stops);

    const routeWithStops = await this.routeRepo.findOne({
      where: { id: savedRoute.id },
      relations: ['stops', 'transportador'],
    });

    return instanceToPlain(routeWithStops);
  }

  async findAllAvailable(filters?: any) {
    const queryBuilder = this.routeRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stops', 'stops')
      .leftJoinAndSelect('route.transportador', 'transportador') // ← AQUI!
      .where('route.status = :status', { status: 'available' });

    if (filters.origin) {
      queryBuilder.andWhere('LOWER(route.origin) LIKE LOWER(:origin)', {
        origin: `%${filters.origin}%`,
      });
    }

    if (filters.destination) {
      queryBuilder.andWhere(
        'LOWER(route.destination) LIKE LOWER(:destination)',
        {
          destination: `%${filters.destination}%`,
        },
      );
    }

    if (filters.date) {
      queryBuilder.andWhere('DATE(route.originDate) = :date', {
        date: filters.date,
      });
    }

    if (filters.species) {
      queryBuilder.andWhere('route.speciesAccepted ILIKE :species', {
        species: `%${filters.species}%`,
      });
    }

    if (filters.size) {
      queryBuilder.andWhere('route.animalSizeAccepted ILIKE :size', {
        size: `%${filters.size}%`,
      });
    }

    const stops = await this.stopRepo.find({
      where: { route: { status: 'available' } },
    });

    console.log('Stops:', stops);

    return queryBuilder.orderBy('route.createdAt', 'DESC').getMany();
  }

  async update(id: string, dto: UpdateRouteDto, user: User) {
    const route = await this.routeRepo.findOne({
      where: { id },
      relations: ['transportador'],
    });

    if (!route) throw new NotFoundException('Rota não encontrada');
    if (route.transportador.id !== user.id)
      throw new UnauthorizedException(
        'Você não tem permissão para editar esta rota',
      );
    if (route.status !== 'available')
      throw new BadRequestException(
        'A rota só pode ser editada se estiver disponível',
      );

    Object.assign(route, dto);
    return this.routeRepo.save(route);
  }

  async startRoute(id: string, user: User) {
    const route = await this.routeRepo.findOne({
      where: { id },
      relations: ['transportador'],
    });

    if (!route || route.transportador.id !== user.id) {
      throw new UnauthorizedException('Você não pode iniciar esta rota');
    }

    if (route.status !== 'available') {
      throw new BadRequestException('A rota não está disponível para iniciar');
    }

    route.status = 'in_progress';
    return this.routeRepo.save(route);
  }

  async completeRoute(id: string, user: User) {
    const route = await this.routeRepo.findOne({
      where: { id },
      relations: ['transportador'],
    });

    if (!route || route.transportador.id !== user.id) {
      throw new UnauthorizedException('Você não pode concluir esta rota');
    }

    if (route.status !== 'in_progress') {
      throw new BadRequestException('A rota não está em andamento');
    }

    route.status = 'completed';
    return this.routeRepo.save(route);
  }

  async listMyRoutes(user: User) {
    return this.routeRepo.find({
      where: { transportador: { id: user.id } },
      order: { createdAt: 'DESC' },
      relations: ['stops'],
    });
  }

  async findOne(id: string) {
    return this.routeRepo.findOne({
      where: { id },
    });
  }
}
