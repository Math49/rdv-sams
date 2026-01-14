import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input } from '@heroui/react';

import { GuestLayout } from '@/Layouts/GuestLayout';
import { api } from '@/lib/api';
import type { ApiResponse, PatientTokenContext } from '@/lib/types';
import { savePatientContext } from '@/lib/patient';
import { useToast } from '@/hooks/useToast';

const TokenLogin = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const { error, success } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) return;

        setLoading(true);
        try {
            const response = await api.post<ApiResponse<PatientTokenContext>>('/api/patient/token/validate', {
                token,
            });
            savePatientContext(response.data.data);
            success('Token valide');
            router.visit(`/patient/doctors/${response.data.data.doctorId}`);
        } catch {
            error('Token invalide ou expire');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Acces patient" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Acces patient</h1>
                    <p className="mt-2 text-sm text-foreground/70">
                        Saisissez votre token temporaire pour acceder a la prise de rendez-vous.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Token"
                        value={token}
                        onValueChange={setToken}
                        isRequired
                        placeholder="Entrer le token recu"
                    />
                    <Button color="primary" type="submit" isLoading={loading} className="w-full">
                        Valider
                    </Button>
                </form>
            </div>
        </GuestLayout>
    );
};

export default TokenLogin;
