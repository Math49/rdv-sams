import { FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';

import { GuestLayout } from '@/Layouts/GuestLayout';
import { patientApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const TokenLogin = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const { error, success } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) return;

        setLoading(true);
        try {
            await patientApi.validateToken({ token: trimmed });
            success('Token valide');
            router.visit('/prise-rdv');
        } catch {
            error('Token invalide ou expiré');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout
            headerAction={
                <Link href="/login" className="text-sm text-sams-muted hover:text-sams-text">
                    Accès médecin
                </Link>
            }
        >
            <Head title="Accès patient" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold text-sams-text">
                        Bienvenue sur notre plateforme de RDV médical SAMS
                    </h1>
                    <p className="mt-2 text-sm text-sams-muted">Saisissez votre token temporaire.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Token"
                        value={token}
                        onValueChange={setToken}
                        isRequired
                        placeholder="Entrer le token reçu"
                    />
                    <Button color="primary" type="submit" isLoading={loading} className="w-full">
                        Accéder
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
};

export default TokenLogin;
