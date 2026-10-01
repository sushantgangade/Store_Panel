import Link from 'next/link';
import { Package, CheckCircle2, XCircle, Boxes, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/server/products';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    const cards = [
        { label: 'Total Products', value: stats.total, icon: Package, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
        { label: 'Active', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
        { label: 'Inactive', value: stats.inactive, icon: XCircle, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950' },
        { label: 'Total Stock', value: stats.totalStock, icon: Boxes, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your store</p>
                </div>
                <Button asChild>
                    <Link href="/products/new">Add product</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((c) => (
                    <Card key={c.label}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${c.tone}`}>
                                <c.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{c.label}</p>
                                <p className="text-2xl font-bold">{c.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recently created</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/products" className="gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {stats.recent.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {stats.recent.map((p) => (
                                <li key={p.id} className="flex items-center gap-4 py-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.image || `https://picsum.photos/seed/${p.id}/80`}
                                        alt={p.name}
                                        className="h-12 w-12 rounded-md object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/products/${p.id}`} className="truncate font-medium hover:underline">
                                            {p.name}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {p.category} · {formatDate(p.createdAt)}
                                        </p>
                                    </div>
                                    <div className="hidden text-right sm:block">
                                        <p className="font-medium">{formatCurrency(p.price)}</p>
                                    </div>
                                    <Badge variant={p.status === 'active' ? 'success' : 'muted'}>{p.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}