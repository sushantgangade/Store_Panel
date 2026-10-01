import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { listCategories } from '@/server/products';
import { auth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
    const session = await auth();
    if (!can(session?.user.role, 'canCreateProduct')) redirect('/products');
    const categories = await listCategories();

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Button asChild variant="ghost" size="sm">
                <Link href="/products" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">New product</h1>
                <p className="text-sm text-muted-foreground">Add a new product to your catalog.</p>
            </div>
            <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
    );
}