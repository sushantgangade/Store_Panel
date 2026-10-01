'use client';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Store, X, LayoutDashboard, Package, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/products/new', label: 'New Product', icon: PlusCircle },
];

export function AppHeader({ user }: { user: { name: string; email: string; role: Role } }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-40 border-b bg-background">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <div className="flex items-center gap-2 lg:hidden">
                    <Store className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Store Panel</span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium leading-tight">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => signOut({ callbackUrl: '/login' })}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {open && (
                <nav className="border-t bg-background lg:hidden" aria-label="Mobile">
                    <div className="space-y-1 p-3">
                        {nav.map((item) => {
                            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                                        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </header>
    );
}