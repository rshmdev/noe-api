import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existing) throw new UnauthorizedException('Email já registrado');

    if (data.role === 'NORMAL' && data.cpf) {
      const exists = await this.userRepo.findOne({ where: { cpf: data.cpf } });
      if (exists) throw new ConflictException('CPF já cadastrado');
    }

    if (data.role === 'TRANSPORTER' && data.cnpj) {
      const exists = await this.userRepo.findOne({
        where: { cnpj: data.cnpj },
      });
      if (exists) throw new ConflictException('CNPJ já cadastrado');
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({ ...data, password: hashed });
    await this.userRepo.save(user);
    return this.login({ email: data.email, password: data.password });
  }

  async completeRegistration(
    userId: string,
    body: CompleteRegistrationDto,
    files: {
      document_front?: Express.Multer.File[];
      document_back?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      cnh_image?: Express.Multer.File[];
      vehicle_doc?: Express.Multer.File[]; // NOVO
    },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.isVerified) {
      throw new BadRequestException('Cadastro já foi completado e verificado');
    }

    if (user.role === 'NORMAL') {
      user.documentFrontUrl = files.document_front?.[0]?.filename || '';
      user.documentBackUrl = files.document_back?.[0]?.filename || '';
      user.selfieUrl = files.selfie?.[0]?.filename || '';
    }

    if (user.role === 'TRANSPORTER') {
      console.log('Salvando vehicleType:', body.vehicleType);
      console.log('Salvando vehiclePlate:', body.vehiclePlate);

      user.vehicleType = body.vehicleType || '';
      user.vehiclePlate = body.vehiclePlate || '';
      user.cnhUrl = files.cnh_image?.[0]?.filename || '';
      user.selfieUrl = files.selfie?.[0]?.filename || '';
      user.vehicleDocumentUrl = files.vehicle_doc?.[0]?.filename || ''; // NOVO
    }

    user.isVerified = false; // Aguardando validação manual
    await this.userRepo.save(user);

    return { message: 'Cadastro complementar enviado com sucesso!' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['reviews', 'reviews.authorUser'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const averageRating =
      user.reviews.length > 0
        ? user.reviews.reduce((acc, cur) => acc + cur.rating, 0) /
          user.reviews.length
        : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isVerified: user.isVerified,

      // Dados específicos
      cpf: user.cpf,
      cnpj: user.cnpj,
      cnhNumber: user.cnh,
      vehicleType: user.vehicleType,
      vehiclePlate: user.vehiclePlate,

      // Documentos
      documentFrontUrl: user.documentFrontUrl,
      documentBackUrl: user.documentBackUrl,
      cnhUrl: user.cnhUrl,
      selfieUrl: user.selfieUrl,

      // Estatísticas
      totalTrips: user.totalTrips,
      totalKm: user.totalKm,
      animalsTransported: user.animalsTransported,

      // Avaliações
      averageRating,
      reviews: user.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        author: {
          id: r.authorUser.id,
          name: r.authorUser.name,
        },
      })),
    };
  }

  async login(data: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) throw new UnauthorizedException('Credenciais inválidas');

    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return { token, user };
  }
}
