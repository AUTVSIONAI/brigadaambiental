import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function isDatabaseUnavailableError(error: unknown) {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const name = (current as any)?.name;
    if (name === 'PrismaClientInitializationError') return true;
    if (name === 'PrismaClientKnownRequestError') {
      const code = (current as any)?.code;
      if (code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1017') return true;
    }

    if (current instanceof Prisma.PrismaClientInitializationError) return true;
    if (current instanceof Prisma.PrismaClientKnownRequestError) {
      const code = (current as any)?.code;
      if (code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1017') return true;
    }

    const code = (current as any)?.code;
    if (code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1017') return true;

    const message = current instanceof Error ? current.message : String(current);
    if (
      message.includes("Can't reach database server") ||
      message.includes('ECONNREFUSED') ||
      message.includes('Connection refused') ||
      message.includes('P1001') ||
      message.includes('P1017')
    ) {
      return true;
    }

    const cause = (current as any)?.cause;
    if (cause) queue.push(cause);
    const errors = (current as any)?.errors;
    if (Array.isArray(errors)) queue.push(...errors);
  }

  return false;
}
