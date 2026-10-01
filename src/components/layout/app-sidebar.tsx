'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, PlusCircle, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/products/new', label: 'New Product', icon: PlusCircle },
];

export function AppSidebar({ role }: { role: Role }) {
    const pathname = usePathname();
    return (
        <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
            <div className="flex h-16 items-center gap-2 border-b px-6">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-semibold">Store Panel</span>
            </div>
            <nav className="flex-1 space-y-1 p-3" aria-label="Main">
                {items.map((item) => {
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t p-3 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{role}</span>
            </div>
        </aside>
    );
}