import type { ListParams } from '@/server/products';

const validSort = ['name', 'price', 'stock', 'createdAt'] as const;
const validDir = ['asc', 'desc'] as const;
const validStatus = ['all', 'active', 'inactive'] as const;

export function getProductSearchParams(sp: Record<string, string | string[] | undefined>): Required<ListParams> {
    const one = (k: string) => {
        const v = sp[k];
        return Array.isArray(v) ? v[0] : v;
    };
    const search = one('search') ?? '';
    const status = (validStatus as readonly string[]).includes(one('status') ?? '')
        ? (one('status') as Required<ListParams>['status'])
        : 'all';
    const categoryId = one('categoryId') ?? '';
    const sortBy = (validSort as readonly string[]).includes(one('sortBy') ?? '')
        ? (one('sortBy') as Required<ListParams>['sortBy'])
        : 'createdAt';
    const sortDir = (validDir as readonly string[]).includes(one('sortDir') ?? '')
        ? (one('sortDir') as Required<ListParams>['sortDir'])
        : 'desc';
    const page = Math.max(1, parseInt(one('page') ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(one('pageSize') ?? '8', 10) || 8));
    return { search, status, categoryId, sortBy, sortDir, page, pageSize };
}

export function buildQuery(base: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(base)) {
        if (v !== undefined && v !== '' && v !== 'all') sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : '';
}