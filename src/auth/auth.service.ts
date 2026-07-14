import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

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
}
