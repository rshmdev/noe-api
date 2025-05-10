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
    this.server.to(receiverUserId).emit('newMessage', message);
    this.server.to(receiverUserId).emit('unreadUpdate', { chatId });
  }

  @SubscribeMessage('joinChat')
  handleJoinRoom(
    @MessageBody() payload: { chatId?: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (payload.chatId) {
      client.join(payload.chatId);
    }
    client.join(payload.userId);
  }
}
