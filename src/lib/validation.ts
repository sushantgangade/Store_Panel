import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(120),
    description: z.string().min(1, 'Description is required').max(2000),
    price: z.coerce.number().positive('Price must be greater than 0'),
    stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
    categoryId: z.string().min(1, 'Category is required'),
    image: z
        .string()
        .url('Image URL must be a valid URL')
        .optional()
        .or(z.literal(''))
        .transform((v) => (v === '' ? undefined : v)),
    status: z.enum(['active', 'inactive']),
});

export type ProductInput = z.infer<typeof productSchema>;

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});