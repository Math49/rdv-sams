import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@heroui/react';

type PatientLayoutProps = {
    children: ReactNode;
};

export const PatientLayout = ({ children }: PatientLayoutProps) => {
    const { url } = usePage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-foreground">
            <header className="border-b border-white/10 bg-black/40 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-lg font-semibold text-white">
                        RDV SAMS
                    </Link>
                    {url !== '/' ? (
                        <Button as={Link} href="/" variant="flat" size="sm">
                            Retour
                        </Button>
                    ) : null}
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    );
};
