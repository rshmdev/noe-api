import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  start(@Body() dto: StartChatDto, @Req() req) {
    return this.chatService.startChat(dto, req.user);
  }

  @Get()
  getAll(@Req() req) {
    return this.chatService.getChats(req.user);
  }

  @Get(':id/messages')
  getMessages(@Param('id') chatId: string, @Req() req) {
    return this.chatService.getMessages(chatId, req.user);
  }

  @Post(':id/read')
  @UseGuards(AuthGuard('jwt'))
  markAsRead(@Param('id') chatId: string, @Req() req) {
    return this.chatService.markAllAsRead(chatId, req.user.id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @Req() req,
  ) {
    return this.chatService.sendMessage(chatId, dto, req.user);
  }
}
