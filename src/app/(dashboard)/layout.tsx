import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="flex min-h-screen bg-muted/30">
            <AppSidebar role={session.user.role} />
            <div className="flex min-w-0 flex-1 flex-col">
                <AppHeader user={{ name: session.user.name ?? '', email: session.user.email ?? '', role: session.user.role }} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}