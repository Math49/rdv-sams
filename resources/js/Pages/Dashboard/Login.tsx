import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';

import { GuestLayout } from '@/Layouts/GuestLayout';
import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { error } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            await api.get('/sanctum/csrf-cookie');
            await api.post<ApiResponse<User>>('/api/auth/login', { identifier, password });
            router.visit('/dashboard');
        } catch {
            error('Identifiants invalides');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Connexion panel</h1>
                    <p className="mt-2 text-sm text-foreground/70">
                        Entrez vos identifiants pour acceder au tableau de bord.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Identifiant" value={identifier} onValueChange={setIdentifier} isRequired />
                    <Input label="Mot de passe" type="password" value={password} onValueChange={setPassword} isRequired />
                    <Button color="primary" type="submit" isLoading={loading} className="w-full">
                        Se connecter
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
};

export default Login;
