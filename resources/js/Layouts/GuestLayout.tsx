import { ReactNode } from 'react';
import { Card, CardBody } from '@heroui/react';

type GuestLayoutProps = {
    children: ReactNode;
};

export const GuestLayout = ({ children }: GuestLayoutProps) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900">
            <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
                <Card className="w-full border border-white/10 bg-white/5 shadow-xl">
                    <CardBody className="p-8">{children}</CardBody>
                </Card>
            </div>
        </div>
    );
};
