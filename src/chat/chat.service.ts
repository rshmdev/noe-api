import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Route } from '../routes/entities/route.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Payment } from 'src/payments/entities/payment.entity';
import { ChatGateway } from './chat.gateway';

export interface ChatPreview {
  id: string;
  route: Route;
  createdAt: Date;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage: {
    text: string;
    createdAt: Date;
    proposal: Proposal | null;
    id: string | null;
  } | null;
  unreadCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,

    @InjectRepository(Message)
    private messageRepo: Repository<Message>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Route)
    private routeRepo: Repository<Route>,

    @InjectRepository(Proposal)
    private proposalRepo: Repository<Proposal>,

    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,

    private readonly chatGateway: ChatGateway,
  ) {}

  async startChat(dto: StartChatDto, currentUser: User) {
    const otherUser = await this.userRepo.findOne({
      where: { id: dto.userId },
    });

    const currentUserDb = await this.userRepo.findOne({
      where: { id: currentUser.id },
    });

    if (!otherUser || !currentUserDb) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const route = await this.routeRepo.findOne({ where: { id: dto.routeId } });

    if (!otherUser || !route) throw new NotFoundException('Dados inválidos');

    const existing = await this.chatRepo.findOne({
      where: [
        { user1: currentUserDb, user2: otherUser, route },
        { user1: otherUser, user2: currentUserDb, route },
      ],
    });

    if (existing) return existing;

    const chat = this.chatRepo.create({
      user1: currentUserDb.role === 'NORMAL' ? currentUserDb : otherUser,
      user2: currentUserDb.role === 'TRANSPORTER' ? currentUserDb : otherUser,
      route,
    });

    return this.chatRepo.save(chat);
  }

  async getChats(user: User) {
    const chats = await this.chatRepo.find({
      where: [{ user1: { id: user.id } }, { user2: { id: user.id } }],
      relations: ['user1', 'user2', 'route'],
      order: { createdAt: 'DESC' },
    });

    const result: ChatPreview[] = [];

    for (const chat of chats) {
      const otherUser = chat.user1.id === user.id ? chat.user2 : chat.user1;

      const lastMessage = await this.messageRepo.findOne({
        where: { chat: { id: chat.id } },
        relations: ['proposal'],
        order: { createdAt: 'DESC' },
      });

      const unreadCount = await this.messageRepo.count({
        where: {
          chat: { id: chat.id },
          read: false,
          sender: { id: otherUser.id },
        },
      });

      result.push({
        id: chat.id,
        route: chat.route,
        createdAt: chat.createdAt,
        otherUser: otherUser,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              proposal: lastMessage.proposal,
              id: lastMessage.proposal ? lastMessage.proposal.id : null,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      });
    }

    return result;
  }

  async getMessages(chatId: string, user: User) {
    const chat = await this.chatRepo.findOne({
      where: [
        { id: chatId, user1: { id: user.id } },
        { id: chatId, user2: { id: user.id } },
      ],
      relations: ['user1', 'user2'],
    });

    if (!chat) throw new NotFoundException('Chat não encontrado');

    const messages = await this.messageRepo.find({
      where: { chat: { id: chatId } },
      relations: [
        'sender',
        'proposal',
        'proposal.route',
        'proposal.user',
        'proposal.transportador',
      ],
      order: { createdAt: 'ASC' },
    });

    const messagesWithPayment: Array<any> = [];

    for (const msg of messages) {
      const response: any = { ...msg };

      if (msg.proposal) {
        const payment = await this.paymentRepo.findOne({
          where: { proposal: { id: msg.proposal.id } },
          relations: ['proposal', 'proposal.user', 'proposal.transportador'],
        });

        if (payment) {
          response.paymentStatus = payment.status;

          if (user.id === msg.proposal.user.id) {
            // usuário normal → vê código de entrega
            response.deliveryCode = payment.deliveryCode;
          }

          if (user.id === msg.proposal.transportador.id) {
            // transportador → vê código de retirada
            response.pickupCode = payment.pickupCode;
          }
        }
      }

      messagesWithPayment.push(response);
    }

    return messagesWithPayment;
  }

  async sendMessage(chatId: string, dto: SendMessageDto, sender: User) {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['user1', 'user2'],
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');

    let proposal: Proposal | undefined;
    if (dto.proposalId) {
      const foundProposal = await this.proposalRepo.findOne({
        where: { id: dto.proposalId },
        relations: ['route', 'user', 'transportador'],
      });

      proposal = foundProposal || undefined;
      if (!proposal) throw new BadRequestException('Proposta inválida');
    }

    const senderDb = await this.userRepo.findOne({
      where: { id: sender.id },
    });

    if (!senderDb) throw new NotFoundException('Usuário não encontrado');

    const msg = this.messageRepo.create({
      chat,
      sender: senderDb,
      text: dto.text,
      proposal: proposal || undefined,
    });

    const savedMessage = await this.messageRepo.save(msg);

    const receiverUser =
      chat.user1.id === senderDb.id ? chat.user2 : chat.user1;

    this.chatGateway.sendNewMessage(
      chatId,
      {
        id: savedMessage.id,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        chatId: chat.id,
        sender: senderDb,
        proposal: savedMessage.proposal,
      },
      receiverUser.id,
    );

    return savedMessage;
  }

  async markAllAsRead(chatId: string, userId: string) {
    console.log(userId);
    const messages = await this.messageRepo.find({
      where: { chat: { id: chatId } },
      relations: ['sender'],
    });

    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where('chatId = :chatId', { chatId })
      .andWhere('senderId != :userId', { userId })
      .execute();
  }
}
