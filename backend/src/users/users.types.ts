import { User } from '@prisma/client';

export type UserEntity = User;

/** Fields safe to return to clients (never the password hash). */
export type UserView = Omit<User, 'passwordHash'>;
