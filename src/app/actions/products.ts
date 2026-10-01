'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
    createProduct,
    updateProduct,
    deleteProduct,
    changeProductStatus,
} from '@/server/products';
import { productSchema } from '@/lib/validation';

type ActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createProductAction(input: unknown): Promise<ActionResult> {
    try {
        const data = productSchema.parse(input);
        await createProduct(data);
        revalidatePath('/products');
        revalidatePath('/dashboard');
        return { ok: true };
    } catch (err) {
        return mapError(err);
    }
}

export async function updateProductAction(id: string, input: unknown): Promise<ActionResult> {
    try {
        const data = productSchema.parse(input);
        await updateProduct(id, data);
        revalidatePath('/products');
        revalidatePath(`/products/${id}`);
        revalidatePath('/dashboard');
        return { ok: true };
    } catch (err) {
        return mapError(err);
    }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
    try {
        await deleteProduct(id);
        revalidatePath('/products');
        revalidatePath('/dashboard');
        return { ok: true };
    } catch (err) {
        return mapError(err);
    }
}

export async function changeStatusAction(id: string, status: 'active' | 'inactive'): Promise<ActionResult> {
    try {
        await changeProductStatus(id, status);
        revalidatePath('/products');
        revalidatePath(`/products/${id}`);
        revalidatePath('/dashboard');
        return { ok: true };
    } catch (err) {
        return mapError(err);
    }
}

function mapError(err: unknown): ActionResult {
    if (err instanceof z.ZodError) {
        return { ok: false, error: 'Validation failed', fieldErrors: err.flatten().fieldErrors as Record<string, string[]> };
    }
    if (err instanceof Error) {
        if (err.message === 'UNAUTHORIZED') return { ok: false, error: 'You must be signed in.' };
        if (err.message === 'FORBIDDEN') return { ok: false, error: 'You do not have permission for this action.' };
        if (err.message.includes('Record to update not found') || err.message.includes('Record to delete does not exist')) {
            return { ok: false, error: 'Product not found.' };
        }
    }
    console.error(err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
}