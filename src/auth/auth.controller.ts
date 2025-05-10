import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { storage } from 'src/config/storage.config';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req) {
    return this.authService.getMe(req.user.id);
  }

  @Post('complete-registration')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Formulário de registro com arquivos e dados adicionais',
    schema: {
      type: 'object',
      properties: {
        vehicleType: { type: 'string', example: 'Caminhão' },
        vehiclePlate: { type: 'string', example: 'ABC-1234' },
        document_front: { type: 'string', format: 'binary' },
        document_back: { type: 'string', format: 'binary' },
        selfie: { type: 'string', format: 'binary' },
        cnh_image: { type: 'string', format: 'binary' },
        vehicle_doc: { type: 'string', format: 'binary' }, // NOVO
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document_front', maxCount: 1 },
        { name: 'document_back', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'cnh_image', maxCount: 1 },
        { name: 'vehicle_doc', maxCount: 1 }, // NOVO
      ],
      { storage: storage },
    ),
  )
  completeRegistration(
    @Req() req,
    @UploadedFiles()
    files: {
      document_front?: Express.Multer.File[];
      document_back?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      cnh_image?: Express.Multer.File[];
      vehicle_doc?: Express.Multer.File[]; // NOVO
    },
    @Body() body: CompleteRegistrationDto,
  ) {
    return this.authService.completeRegistration(req.user.id, body, files);
  }
}
