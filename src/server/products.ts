import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Prisma, ProductStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { productSchema, type ProductInput } from '@/lib/validation';

export type ProductListItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string | null;
    status: ProductStatus;
    category: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
};

export type ListParams = {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    categoryId?: string;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
};

export async function listProducts(params: ListParams) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 8));
    const sortBy = params.sortBy ?? 'createdAt';
    const sortDir = params.sortDir ?? 'desc';

    const where: Prisma.ProductWhereInput = {};
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.categoryId) where.categoryId = params.categoryId;

    const [total, rows] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { [sortBy]: sortDir },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);

    const items: ProductListItem[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        image: r.image,
        status: r.status,
        category: { id: r.category.id, name: r.category.name },
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }));

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProduct(id: string) {
    const p = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p) return null;
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        stock: p.stock,
        image: p.image,
        status: p.status,
        category: { id: p.category.id, name: p.category.name },
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    };
}

export async function getDashboardStats() {
    const [total, active, inactive, stockSum, recent] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: 'active' } }),
        prisma.product.count({ where: { status: 'inactive' } }),
        prisma.product.aggregate({ _sum: { stock: true } }),
        prisma.product.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        }),
    ]);

    return {
        total,
        active,
        inactive,
        totalStock: stockSum._sum.stock ?? 0,
        recent: recent.map((r) => ({
            id: r.id,
            name: r.name,
            image: r.image,
            price: Number(r.price),
            status: r.status,
            category: r.category.name,
            createdAt: r.createdAt.toISOString(),
        })),
    };
}

async function requireUser(permission: Parameters<typeof can>[1]) {
    const session = await auth();
    if (!session?.user) throw new Error('UNAUTHORIZED');
    if (!can(session.user.role, permission)) throw new Error('FORBIDDEN');
    return session.user;
}

export async function createProduct(input: ProductInput) {
    await requireUser('canCreateProduct');
    const data = productSchema.parse(input);
    const p = await prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            image: data.image ?? null,
            status: data.status,
            categoryId: data.categoryId,
        },
        include: { category: true },
    });
    return { id: p.id };
}

export async function updateProduct(id: string, input: ProductInput) {
    await requireUser('canEditProduct');
    const data = productSchema.parse(input);
    await prisma.product.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            image: data.image ?? null,
            status: data.status,
            categoryId: data.categoryId,
        },
    });
}

export async function deleteProduct(id: string) {
    await requireUser('canDeleteProduct');
    await prisma.product.delete({ where: { id } });
}

export async function changeProductStatus(id: string, status: ProductStatus) {
    await requireUser('canChangeStatus');
    await prisma.product.update({ where: { id }, data: { status } });
}

export async function listCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
}