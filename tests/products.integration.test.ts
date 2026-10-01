import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { listProducts } from '@/server/products';

const prisma = new PrismaClient();

describe.skipIf(!process.env.DATABASE_URL)('listProducts integration', () => {
    beforeAll(async () => { await prisma.$connect(); });

    it('filters by search + status + category', async () => {
        const cats = await prisma.category.findMany();
        const food = cats.find((c) => c.name === 'Food')!;
        const r = await listProducts({ search: 'pizza', status: 'active', categoryId: food.id, page: 1, pageSize: 10 });
        expect(r.items.every((p) => p.name.toLowerCase().includes('pizza'))).toBe(true);
        expect(r.items.every((p) => p.status === 'active')).toBe(true);
        expect(r.items.every((p) => p.category.id === food.id)).toBe(true);
    });

    it('sorts by price asc', async () => {
        const r = await listProducts({ sortBy: 'price', sortDir: 'asc', page: 1, pageSize: 5 });
        const prices = r.items.map((p) => p.price);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('paginates', async () => {
        const p1 = await listProducts({ page: 1, pageSize: 3 });
        const p2 = await listProducts({ page: 2, pageSize: 3 });
        expect(p1.items).toHaveLength(3);
        expect(p2.items[0]?.id).not.toBe(p1.items[0]?.id);
    });
});