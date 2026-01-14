import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button, Divider } from '@heroui/react';

import { useAuth, useIsAdmin } from '@/hooks/useAuth';

type DashboardLayoutProps = {
    children: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { url } = usePage();
    const user = useAuth();
    const isAdmin = useIsAdmin();
    const navItems = [
        { label: 'Calendrier', href: '/dashboard' },
        { label: 'Calendriers', href: '/dashboard/calendars' },
        ...(isAdmin ? [{ label: 'Admin', href: '/dashboard/admin' }] : []),
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-foreground">
            <div className="flex min-h-screen">
                <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 px-6 py-6 lg:flex">
                    <Link href="/dashboard" className="text-xl font-semibold text-white">
                        Panel RDV
                    </Link>
                    <Divider className="my-6 opacity-40" />
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = url === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center rounded-large px-3 py-2 text-sm ${
                                        isActive ? 'bg-white/10 text-white' : 'text-foreground/70'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <div className="flex-1">
                    <header className="border-b border-white/10 bg-black/30 backdrop-blur">
                        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-2 lg:hidden">
                                <Button as={Link} href="/dashboard" size="sm" variant="flat">
                                    Panel
                                </Button>
                            </div>
                            <div className="text-sm text-foreground/70">
                                {user ? `Connecte: ${user.name || user.identifier}` : 'Non connecte'}
                            </div>
                        </div>
                    </header>
                    <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
                </div>
            </div>
        </div>
    );
};
