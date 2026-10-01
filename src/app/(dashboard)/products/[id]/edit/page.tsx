import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { getProduct, listCategories } from '@/server/products';
import { auth } from '@/lib/auth';
import { can } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [product, categories, session] = await Promise.all([getProduct(id), listCategories(), auth()]);
    if (!product) notFound();
    if (!can(session?.user.role, 'canEditProduct')) redirect(`/products/${id}`);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Button asChild variant="ghost" size="sm">
                <Link href={`/products/${id}`} className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Edit product</h1>
                <p className="text-sm text-muted-foreground">Update {product.name}.</p>
            </div>
            <ProductForm
                categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                initial={{
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    categoryId: product.category.id,
                    image: product.image,
                    status: product.status,
                }}
            />
        </div>
    );
}