import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class FirstAccessEmailDto {
  @IsEmail()
  email!: string;
}

class FirstAccessSetupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('first-access/check')
  checkFirstAccess(@Body() dto: FirstAccessEmailDto) {
    return this.auth.checkFirstAccess(dto.email);
  }

  @Post('first-access/setup')
  setupFirstAccess(@Body() dto: FirstAccessSetupDto) {
    return this.auth.setupFirstAccess(dto.email, dto.password, dto.name);
  }
}
