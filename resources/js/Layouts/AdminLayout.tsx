import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button, Divider } from '@heroui/react';

import { useAuth, useIsAdmin } from '@/hooks/useAuth';

type AdminLayoutProps = {
    children: ReactNode;
};

const adminItems = [
    { label: 'Dashboard admin', href: '/dashboard/admin' },
    { label: 'Médecins', href: '/dashboard/admin/doctors' },
    { label: 'SAMS', href: '/dashboard/admin/sams' },
    { label: 'Rendez-vous', href: '/dashboard/admin/appointments' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const { url } = usePage();
    const user = useAuth();
    const isAdmin = useIsAdmin();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-foreground">
            <div className="flex min-h-screen">
                <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 px-6 py-6 lg:flex">
                    <Link href="/dashboard/admin" className="text-xl font-semibold text-white">
                        Admin
                    </Link>
                    <Divider className="my-6 opacity-40" />
                    <nav className="space-y-2">
                        {adminItems.map((item) => {
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
                    <Divider className="my-6 opacity-40" />
                    <Button as={Link} href="/dashboard" variant="flat" size="sm">
                        Retour panel
                    </Button>
                </aside>
                <div className="flex-1">
                    <header className="border-b border-white/10 bg-black/30 backdrop-blur">
                        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-2 lg:hidden">
                                <Button as={Link} href="/dashboard/admin" size="sm" variant="flat">
                                    Admin
                                </Button>
                            </div>
                            <div className="text-sm text-foreground/70">
                                {isAdmin && user ? `Admin: ${user.name || user.identifier}` : 'Acces restreint'}
                            </div>
                        </div>
                    </header>
                    <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
                </div>
            </div>
        </div>
    );
};
