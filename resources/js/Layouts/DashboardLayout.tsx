import { ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@heroui/react';

import { Sidebar } from '@/Components/ui/Sidebar';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type DashboardLayoutProps = {
    children: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { url } = usePage();
    const user = useAuth();
    const isAdmin = useIsAdmin();
    const navItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Calendriers', href: '/dashboard/calendriers' },
        ...(isAdmin ? [{ label: 'Admin', href: '/dashboard/admin' }] : []),
    ];

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            router.visit('/login');
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-sams-bg text-sams-text">
            <div className="flex h-screen">
                <Sidebar
                    items={navItems}
                    activePath={url}
                    footer={
                        <div className="space-y-3">
                            <div className="text-sm">
                                <p className="text-sams-muted">Connecté</p>
                                <p className="font-semibold text-sams-text">{user?.name || user?.identifier || 'Médecin'}</p>
                            </div>
                            <Button variant="flat" size="sm" onPress={handleLogout}>
                                Déconnexion
                            </Button>
                        </div>
                    }
                />
                <div className="flex-1">
                    <header className="border-b border-sams-border bg-sams-surface">
                        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-2 lg:hidden">
                                <Button as={Link} href="/dashboard" size="sm" variant="flat">
                                    Menu
                                </Button>
                            </div>
                            <div className="text-sm text-sams-muted">
                                {user ? `Connecté: ${user.name || user.identifier}` : 'Non connecté'}
                            </div>
                        </div>
                    </header>
                    <div className='overflow-y-scroll max-h-full px-6 py-8' >
                        <main className="mx-auto max-w-6xl">{children}</main>
                    </div>
                </div>
            </div>
        </div>
    );
};
