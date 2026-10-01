import { getProductSearchParams } from '@/lib/url-state';
import { listProducts, listCategories } from '@/server/products';
import { ProductsView } from '@/components/products/products-view';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
    const sp = await searchParams;
    const parsed = getProductSearchParams(sp);

    const [data, categories, session] = await Promise.all([
        listProducts(parsed),
        listCategories(),
        auth(),
    ]);

    return (
        <ProductsView
            data={data}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            params={parsed}
            role={session!.user.role}
        />
    );
}