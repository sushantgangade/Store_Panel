'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Plus, Search, Trash2, Pencil, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { ProductListItem, ListParams } from '@/server/products';
import type { Role } from '@prisma/client';
import { can } from '@/lib/permissions';
import { changeStatusAction, deleteProductAction } from '@/app/actions/products';

type Props = {
    data: { items: ProductListItem[]; total: number; page: number; pageSize: number; totalPages: number };
    categories: { id: string; name: string }[];
    params: Required<ListParams>;
    role: Role;
};

export function ProductsView({ data, categories, params, role }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [pending, startTransition] = useTransition();

    const [search, setSearch] = useState(params.search);
    const [deleting, setDeleting] = useState<ProductListItem | null>(null);

    useEffect(() => setSearch(params.search), [params.search]);

    const update = (patch: Partial<Required<ListParams>>) => {
        const next = { ...params, ...patch };
        if (patch.search !== undefined || patch.status || patch.categoryId || patch.sortBy || patch.sortDir) {
            next.page = 1;
        }
        const sp = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== 'all') sp.set(k, String(v));
        });
        startTransition(() => router.push(`${pathname}?${sp.toString()}`));
    };

    const onSubmitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        update({ search });
    };

    const onDelete = async () => {
        if (!deleting) return;
        startTransition(async () => {
            const res = await deleteProductAction(deleting.id);
            if (!res.ok) {
                toast({ title: 'Delete failed', description: res.error, variant: 'destructive' });
            } else {
                toast({ title: 'Product deleted', variant: 'success' });
            }
            setDeleting(null);
            router.refresh();
        });
    };

    const onToggleStatus = async (p: ProductListItem) => {
        const next = p.status === 'active' ? 'inactive' : 'active';
        startTransition(async () => {
            const res = await changeStatusAction(p.id, next);
            if (!res.ok) toast({ title: 'Update failed', description: res.error, variant: 'destructive' });
            else toast({ title: `Marked as ${next}`, variant: 'success' });
            router.refresh();
        });
    };

    const sortValue = `${params.sortBy}:${params.sortDir}`;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
                    <p className="text-sm text-muted-foreground">{data.total} product{data.total === 1 ? '' : 's'}</p>
                </div>
                {can(role, 'canCreateProduct') && (
                    <Button asChild>
                        <Link href="/products/new" className="gap-1">
                            <Plus className="h-4 w-4" /> New product
                        </Link>
                    </Button>
                )}
            </div>

            <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 lg:grid-cols-4">
                <form onSubmit={onSubmitSearch} className="relative">
                    <label htmlFor="search" className="sr-only">Search products</label>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name…"
                        className="pl-9"
                    />
                </form>

                <Select value={params.status} onValueChange={(v) => update({ status: v as Required<ListParams>['status'] })}>
                    <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={params.categoryId || 'all'} onValueChange={(v) => update({ categoryId: v === 'all' ? '' : v })}>
                    <SelectTrigger aria-label="Filter by category"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={sortValue} onValueChange={(v) => {
                    const [sortBy, sortDir] = v.split(':');
                    update({ sortBy: sortBy as Required<ListParams>['sortBy'], sortDir: sortDir as Required<ListParams>['sortDir'] });
                }}>
                    <SelectTrigger aria-label="Sort by"><SelectValue placeholder="Sort" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt:desc">Newest first</SelectItem>
                        <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                        <SelectItem value="name:asc">Name (A–Z)</SelectItem>
                        <SelectItem value="name:desc">Name (Z–A)</SelectItem>
                        <SelectItem value="price:asc">Price (low → high)</SelectItem>
                        <SelectItem value="price:desc">Price (high → low)</SelectItem>
                        <SelectItem value="stock:asc">Stock (low → high)</SelectItem>
                        <SelectItem value="stock:desc">Stock (high → low)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {data.items.length === 0 ? (
                <EmptyState onCreate={can(role, 'canCreateProduct') ? () => router.push('/products/new') : undefined} />
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
                        <table className="w-full text-sm">
                            <caption className="sr-only">Products list</caption>
                            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Product</th>
                                    <th scope="col" className="px-4 py-3">Category</th>
                                    <th scope="col" className="px-4 py-3">Price</th>
                                    <th scope="col" className="px-4 py-3">Stock</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Created</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.items.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.image || `https://picsum.photos/seed/${p.id}/80`}
                                                    alt={p.name}
                                                    className="h-10 w-10 rounded-md object-cover"
                                                />
                                                <div className="min-w-0">
                                                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                                                    <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{p.category.name}</td>
                                        <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                                        <td className="px-4 py-3">{p.stock}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                disabled={!can(role, 'canChangeStatus') || pending}
                                                onClick={() => onToggleStatus(p)}
                                                className="disabled:cursor-not-allowed disabled:opacity-60"
                                                aria-label={`Toggle status for ${p.name}, currently ${p.status}`}
                                            >
                                                <Badge variant={p.status === 'active' ? 'success' : 'muted'}>{p.status}</Badge>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon" aria-label={`View ${p.name}`}>
                                                    <Link href={`/products/${p.id}`}><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                                {can(role, 'canEditProduct') && (
                                                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.name}`}>
                                                        <Link href={`/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                                                    </Button>
                                                )}
                                                {can(role, 'canDeleteProduct') && (
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        onClick={() => setDeleting(p)}
                                                        aria-label={`Delete ${p.name}`}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="grid gap-3 md:hidden">
                        {data.items.map((p) => (
                            <div key={p.id} className="rounded-lg border bg-card p-4">
                                <div className="flex gap-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.image || `https://picsum.photos/seed/${p.id}/80`}
                                        alt={p.name}
                                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                                        <p className="text-xs text-muted-foreground">{p.category.name} · {formatDate(p.createdAt)}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant={p.status === 'active' ? 'success' : 'muted'}>{p.status}</Badge>
                                            <span className="text-sm font-medium">{formatCurrency(p.price)}</span>
                                            <span className="text-xs text-muted-foreground">Stock {p.stock}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button asChild variant="outline" size="sm" className="flex-1">
                                        <Link href={`/products/${p.id}`}>View</Link>
                                    </Button>
                                    {can(role, 'canEditProduct') && (
                                        <Button asChild variant="outline" size="sm" className="flex-1">
                                            <Link href={`/products/${p.id}/edit`}>Edit</Link>
                                        </Button>
                                    )}
                                    {can(role, 'canDeleteProduct') && (
                                        <Button variant="outline" size="sm" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        page={data.page}
                        totalPages={data.totalPages}
                        onPage={(p) => update({ page: p })}
                        disabled={pending}
                    />
                </>
            )}

            <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={onDelete} disabled={pending}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Pagination({
    page, totalPages, onPage, disabled,
}: { page: number; totalPages: number; onPage: (p: number) => void; disabled?: boolean }) {
    if (totalPages <= 1) return null;
    const pages: (number | '…')[] = [];
    const push = (n: number | '…') => pages.push(n);
    push(1);
    if (page > 3) push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push('…');
    if (totalPages > 1) push(totalPages);

    return (
        <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
            <Button variant="outline" size="sm" disabled={page <= 1 || disabled} onClick={() => onPage(page - 1)}>
                Previous
            </Button>
            {pages.map((p, i) =>
                p === '…' ? (
                    <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
                ) : (
                    <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        aria-current={p === page ? 'page' : undefined}
                        disabled={disabled}
                        onClick={() => onPage(p)}
                    >
                        {p}
                    </Button>
                )
            )}
            <Button variant="outline" size="sm" disabled={page >= totalPages || disabled} onClick={() => onPage(page + 1)}>
                Next
            </Button>
        </nav>
    );
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MoreVertical className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
            {onCreate && (
                <Button onClick={onCreate} className="gap-1">
                    <Plus className="h-4 w-4" /> Create your first product
                </Button>
            )}
        </div>
    );
}