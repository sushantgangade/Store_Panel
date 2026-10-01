import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
    pages: { signIn: '/login' },
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            async authorize(raw) {
                const parsed = credentialsSchema.safeParse(raw);
                if (!parsed.success) return null;

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email.toLowerCase() },
                });
                if (!user) return null;

                const ok = await bcrypt.compare(parsed.data.password, user.password);
                if (!ok) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role as Role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
});