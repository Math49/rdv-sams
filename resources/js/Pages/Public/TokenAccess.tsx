import { FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';
import type { AxiosError } from 'axios';

import { PublicLayout } from '@/Layouts/PublicLayout';
import { patientApi } from '@/lib/api';
import type { ApiError, ApiResponse, PatientTokenContext } from '@/lib/types';
import { savePatientContext } from '@/lib/patient';
import { useToast } from '@/hooks/useToast';

const TokenAccess = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const { error, success } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) return;
        if (trimmed.length !== 10) {
            const message = 'Le token doit contenir 10 caracteres.';
            setTokenError(message);
            error('Token invalide', message);
            return;
        }

        setLoading(true);
        setTokenError(null);
        try {
            const response = await patientApi.validateToken({ token: trimmed });
            const data = (response.data as ApiResponse<PatientTokenContext>).data;
            savePatientContext(data);
            success('Token valide');
            router.visit('/prise-rdv');
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            if (axiosError.response?.status === 422) {
                const message = axiosError.response.data?.errors?.token?.[0] || 'Token invalide.';
                setTokenError(message);
                error('Token invalide', message);
                return;
            }
            error('Token invalide ou expire');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PublicLayout
            rightSlot={
                <Link href="/login" className="text-sm text-neutral-400 hover:text-white">
                    Acces medecin
                </Link>
            }
        >
            <Head title="Acces patient" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white">
                        Bienvenue sur notre plateforme de RDV medical
                    </h1>
                    <p className="mt-2 text-sm text-neutral-400">Saisissez votre token temporaire.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Token"
                        value={token}
                        onValueChange={(value) => {
                            setToken(value);
                            if (tokenError) setTokenError(null);
                        }}
                        isRequired
                        placeholder="Entrer le token recu"
                        isInvalid={Boolean(tokenError)}
                        errorMessage={tokenError || undefined}
                    />
                    <Button color="primary" type="submit" isLoading={loading} className="w-full">
                        Acceder
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
};

export default TokenAccess;
