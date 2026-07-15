import { Injectable, 
    ConflictException,
    UnauthorizedException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto){
        const {fullName, email, password, phone} = registerDto;

        const existingUser = await this.prisma.user.findUnique({
            where: {
              email,
            },
          });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                full_name: fullName,
                email,
                password_hash: hashedPassword,
                phone,
            },                      
        });
        return {
            message: 'User registered successfully',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
            },
        };
        
    }

    async login(loginDto: LoginDto){
        const {email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });

        if(!user){
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
          }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            message: 'Login Successful',
            accessToken,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
            },
        };


    }
}
