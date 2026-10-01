import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <h1 className="text-3xl font-bold">Product not found</h1>
            <p className="text-muted-foreground">The product you're looking for doesn't exist or has been removed.</p>
            <Button asChild><Link href="/products">Back to products</Link></Button>
        </div>
    );
}