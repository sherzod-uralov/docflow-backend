import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokensDto } from './dto/tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokensDto> {
    const user = await this.usersService.create(registerDto);

    // Generate tokens
    return this.generateTokens(user.id, user.username, user.email, user.roleId);
  }

  async login(loginDto: LoginDto): Promise<TokensDto> {
    const { usernameOrEmail, password } = loginDto;
    let user;
    try {
      if (usernameOrEmail.includes('@')) {
        user = await this.usersService.findByEmail(usernameOrEmail);
      } else {
        user = await this.usersService.findByUsername(usernameOrEmail);
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.username, user.email, user.roleId);
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.usersService.findOne(payload.sub);

      // Generate new tokens
      return this.generateTokens(
        user.id,
        user.username,
        user.email,
        user.roleId,
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: number) {
    return this.usersService.findOne(userId);
  }

  private generateTokens(
    userId: number,
    username: string,
    email: string,
    roleId: number,
  ): TokensDto {
    const accessTokenPayload = {
      sub: userId,
      username,
      email,
      roleId,
      type: 'access',
    };

    const refreshTokenPayload = {
      sub: userId,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d', // Refresh token valid for 7 days
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
