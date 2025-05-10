import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Controller('proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  create(@Body() dto: CreateProposalDto, @Req() req) {
    return this.proposalsService.create(dto, req.user);
  }

  @Get('received')
  listReceived(@Req() req) {
    return this.proposalsService.listReceived(req.user);
  }

  @Get('sent')
  listSent(@Req() req) {
    return this.proposalsService.listSent(req.user);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req) {
    return this.proposalsService.accept(id, req.user);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Req() req) {
    return this.proposalsService.reject(id, req.user);
  }
}
