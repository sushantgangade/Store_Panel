import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProduct } from '@/server/products';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { can } from '@/lib/permissions';
import { ProductActions } from '@/components/products/product-actions';

export const dynamic = 'force-dynamic';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [product, session] = await Promise.all([getProduct(id), auth()]);
    if (!product) notFound();
    const role = session!.user.role;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/products" className="gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to products
                    </Link>
                </Button>
                <ProductActions product={product} role={role} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="overflow-hidden">
                    <div className="aspect-video w-full bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.image || `https://picsum.photos/seed/${product.id}/800/500`}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold">{product.name}</h1>
                                <p className="text-sm text-muted-foreground">{product.category.name}</p>
                            </div>
                            <Badge variant={product.status === 'active' ? 'success' : 'muted'}>{product.status}</Badge>
                        </div>

                        <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

                        <dl className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground">Price</dt>
                                <dd className="text-lg font-semibold">{formatCurrency(product.price)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground">Stock</dt>
                                <dd className="text-lg font-semibold">{product.stock}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground">Created</dt>
                                <dd className="text-sm">{formatDate(product.createdAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground">Updated</dt>
                                <dd className="text-sm">{formatDate(product.updatedAt)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}