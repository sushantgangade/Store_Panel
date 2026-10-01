'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { can } from '@/lib/permissions';
import type { Role, ProductStatus } from '@prisma/client';
import { changeStatusAction, deleteProductAction } from '@/app/actions/products';
import type { ProductListItem } from '@/server/products';

export function ProductActions({ product, role }: { product: ProductListItem; role: Role }) {
    const router = useRouter();
    const { toast } = useToast();
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);

    const nextStatus: ProductStatus = product.status === 'active' ? 'inactive' : 'active';

    const onStatus = () => {
        startTransition(async () => {
            const res = await changeStatusAction(product.id, nextStatus);
            if (!res.ok) toast({ title: 'Failed', description: res.error, variant: 'destructive' });
            else toast({ title: `Marked as ${nextStatus}`, variant: 'success' });
            router.refresh();
        });
    };

    const onDelete = () => {
        startTransition(async () => {
            const res = await deleteProductAction(product.id);
            if (!res.ok) {
                toast({ title: 'Delete failed', description: res.error, variant: 'destructive' });
                setConfirming(false);
                return;
            }
            toast({ title: 'Product deleted', variant: 'success' });
            router.push('/products');
            router.refresh();
        });
    };

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {can(role, 'canChangeStatus') && (
                    <Button variant="outline" size="sm" onClick={onStatus} disabled={pending} className="gap-1">
                        <Power className="h-4 w-4" />
                        Mark as {nextStatus}
                    </Button>
                )}
                {can(role, 'canEditProduct') && (
                    <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={`/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" /> Edit
                        </Link>
                    </Button>
                )}
                {can(role, 'canDeleteProduct') && (
                    <Button
                        variant="destructive" size="sm" className="gap-1"
                        onClick={() => setConfirming(true)}
                        disabled={pending}
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={onDelete} disabled={pending}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}