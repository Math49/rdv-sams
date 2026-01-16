import { FormEvent, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Spinner, Switch } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type DoctorsEditProps = {
    id: string;
};

const DoctorsEdit = ({ id }: DoctorsEditProps) => {
    const [doctor, setDoctor] = useState<User | null>(null);
    const [identifier, setIdentifier] = useState('');
    const [name, setName] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [specialtyIds, setSpecialtyIds] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const { success } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<User>>(`/api/admin/doctors/${id}`);
                const data = response.data.data;
                setDoctor(data);
                setIdentifier(data.identifier);
                setName(data.name || '');
                setRoles(data.roles || []);
                setSpecialtyIds((data.specialtyIds || []).join(', '));
                setIsActive(Boolean(data.isActive));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleSave = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const specialties = specialtyIds
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

            await api.patch(`/api/admin/doctors/${id}`, {
                identifier,
                name: name || undefined,
                roles,
                specialtyIds: specialties,
                isActive,
            });
            success('Compte mis à jour');
            router.visit('/dashboard/admin/comptes');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!password) return;
        setResetting(true);
        try {
            await api.post(`/api/admin/doctors/${id}/reset-password`, { password });
            success('Mot de passe réinitialisé');
            setPassword('');
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Spinner />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Modifier le compte" />
            <div className="space-y-6">
                <PageHeader
                    title="Modifier le compte"
                    subtitle={doctor?.identifier || ''}
                    backHref="/dashboard/admin/comptes"
                />
                <form onSubmit={handleSave} className="space-y-4">
                    <Input label="Identifiant" value={identifier} onValueChange={setIdentifier} isRequired />
                    <Input label="Nom" value={name} onValueChange={setName} />
                    <Select
                        label="Rôles"
                        selectionMode="multiple"
                        selectedKeys={new Set(roles)}
                        onSelectionChange={(keys) => {
                            if (keys === 'all') {
                                setRoles(['doctor', 'admin']);
                                return;
                            }
                            setRoles(Array.from(keys).map(String));
                        }}
                    >
                        <SelectItem key="doctor">
                            Médecin
                        </SelectItem>
                        <SelectItem key="admin">
                            Administrateur
                        </SelectItem>
                    </Select>
                    <Input
                        label="Spécialités (séparées par virgule)"
                        value={specialtyIds}
                        onValueChange={setSpecialtyIds}
                    />
                    <Switch isSelected={isActive} onValueChange={setIsActive}>
                        Actif
                    </Switch>
                    <Button color="primary" type="submit" isLoading={saving}>
                        Enregistrer
                    </Button>
                </form>

                <div className="rounded-large border border-sams-border bg-sams-surface/70 p-4">
                    <p className="text-sm font-semibold">Réinitialiser le mot de passe</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Input
                            label="Nouveau mot de passe"
                            type="password"
                            value={password}
                            onValueChange={setPassword}
                        />
                        <Button color="danger" isLoading={resetting} onPress={handleResetPassword}>
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DoctorsEdit;
