import { describe, it, expect } from 'vitest';
import { productSchema } from '@/lib/validation';

describe('productSchema', () => {
    const base = {
        name: 'Test Product',
        description: 'A description',
        price: 10,
        stock: 5,
        categoryId: 'cat_1',
        status: 'active' as const,
    };

    it('accepts valid input', () => {
        expect(productSchema.safeParse(base).success).toBe(true);
    });

    it('rejects name shorter than 3 chars', () => {
        const r = productSchema.safeParse({ ...base, name: 'ab' });
        expect(r.success).toBe(false);
    });

    it('rejects non-positive price', () => {
        expect(productSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
        expect(productSchema.safeParse({ ...base, price: -5 }).success).toBe(false);
    });

    it('rejects negative stock', () => {
        expect(productSchema.safeParse({ ...base, stock: -1 }).success).toBe(false);
    });

    it('rejects invalid image URL', () => {
        expect(productSchema.safeParse({ ...base, image: 'not-a-url' }).success).toBe(false);
    });

    it('allows missing image', () => {
        const r = productSchema.safeParse({ ...base, image: undefined });
        expect(r.success).toBe(true);
    });

    it('coerces numeric strings', () => {
        const r = productSchema.safeParse({ ...base, price: '9.99', stock: '7' });
        expect(r.success).toBe(true);
        if (r.success) {
            expect(r.data.price).toBe(9.99);
            expect(r.data.stock).toBe(7);
        }
    });
});