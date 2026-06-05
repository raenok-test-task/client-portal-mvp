import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('4Blanc#Demo26', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'client@4blanc.com',
      name: 'Anna',
      passwordHash,
    });

    const res = await service.login({ email: 'client@4blanc.com', password: '4Blanc#Demo26' });
    expect(res.accessToken).toBe('token');
    expect(res.user.email).toBe('client@4blanc.com');
  });

  it('rejects an invalid password', async () => {
    const passwordHash = await bcrypt.hash('4Blanc#Demo26', 10);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c', passwordHash });
    await expect(service.login({ email: 'a@b.c', password: 'wrong-password' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@4blanc.com', password: '4Blanc#Demo26' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
