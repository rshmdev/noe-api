import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  sendNewMessage(chatId: string, message: any, receiverUserId: string) {
    // Envia para todos os usuários na sala do chat
    this.server.to(chatId).emit('newMessage', message);

    // Envia a atualização de mensagem não lida para o usuário específico
    this.server.to(receiverUserId).emit('unreadUpdate', { chatId });
  }

  @SubscribeMessage('joinChat')
  handleJoinRoom(
    @MessageBody() payload: { chatId?: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (payload.chatId) {
      console.log(`User ${payload.userId} joined chat ${payload.chatId}`);
      client.join(payload.chatId);
    }

    console.log(`User ${payload.userId} joined their personal room`);
    client.join(payload.userId);
  }
}
