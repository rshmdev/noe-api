import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from './entities/proposal.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { User } from '../users/entities/user.entity';
import { Route } from '../routes/entities/route.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { Message } from 'src/chat/entities/message.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepo: Repository<Proposal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Route)
    private routeRepo: Repository<Route>,

    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,

    @InjectRepository(Message)
    private messageRepo: Repository<Message>,

    private readonly chatGateway: ChatGateway,

    private readonly chatService: ChatService,
  ) {}

  async create(dto: CreateProposalDto, transportador: User) {
    if (transportador.role !== 'TRANSPORTER') {
      throw new UnauthorizedException(
        'Apenas transportadores podem enviar propostas',
      );
    }

    const route = await this.routeRepo.findOne({ where: { id: dto.routeId } });
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });

    if (!route || !user) {
      throw new NotFoundException('Rota ou usuário não encontrado');
    }

    const senderDb = await this.userRepo.findOne({
      where: { id: transportador.id },
    });

    if (!senderDb) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const proposal = this.proposalRepo.create({
      route,
      user,
      transportador: senderDb,
      status: 'pending',
      price: dto.price,
      message: dto.message,
    });

    const savedProposal = await this.proposalRepo.save(proposal);

    await this.chatService.sendMessage(
      dto.chatId,
      {
        proposalId: savedProposal.id,
      },
      senderDb,
    );

    return savedProposal;
  }

  async listReceived(user: User) {
    return this.proposalRepo.find({
      where: { user },
      relations: ['route', 'transportador'],
      order: { createdAt: 'DESC' },
    });
  }

  async listSent(transportador: User) {
    return this.proposalRepo.find({
      where: { transportador },
      relations: ['route', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async accept(id: string, user: User) {
    const proposal = await this.proposalRepo.findOne({
      where: { id },
      relations: ['user', 'transportador'],
    });

    if (!proposal || proposal.user.id !== user.id) {
      throw new UnauthorizedException('Você não pode aceitar esta proposta');
    }

    proposal.status = 'accepted';

    const chat = await this.chatRepo.findOne({
      where: { messages: { proposal: { id: proposal.id } } },
      relations: ['user1', 'user2'],
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    this.chatGateway.sendNewMessage(
      chat.id,
      {
        id: `proposal-${proposal.id}`,
        text: '',
        chatId: chat.id,
        proposal: {
          id: proposal.id,
          status: proposal.status,
          price: proposal.price,
        },
        createdAt: new Date(),
      },
      proposal.transportador.id,
    );

    return this.proposalRepo.save(proposal);
  }

  async reject(id: string, user: User) {
    const proposal = await this.proposalRepo.findOne({
      where: { id },
      relations: ['user', 'transportador'],
    });

    if (!proposal || proposal.user.id !== user.id) {
      throw new UnauthorizedException('Você não pode recusar esta proposta');
    }

    proposal.status = 'rejected';

    const chat = await this.chatRepo.findOne({
      where: { messages: { proposal: { id: proposal.id } } },
      relations: ['user1', 'user2'],
    });

    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    this.chatGateway.sendNewMessage(
      chat.id,
      {
        id: `proposal-${proposal.id}`,
        text: '',
        chatId: chat.id,
        proposal: {
          id: proposal.id,
          status: proposal.status,
          price: proposal.price,
        },
        createdAt: new Date(),
      },
      proposal.transportador.id,
    );

    return this.proposalRepo.save(proposal);
  }
}
