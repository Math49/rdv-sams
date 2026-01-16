import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Switch } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const DoctorsCreate = () => {
    const [identifier, setIdentifier] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<string[]>(['doctor']);
    const [specialtyIds, setSpecialtyIds] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const { success } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const specialties = specialtyIds
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

            await api.post('/api/admin/doctors', {
                identifier,
                name: name || undefined,
                password,
                roles,
                specialtyIds: specialties,
                isActive,
            });
            success('Compte créé');
            router.visit('/dashboard/admin/comptes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Créer un compte" />
            <div className="space-y-6">
                <PageHeader
                    title="Créer un compte"
                    subtitle="Ajoutez un nouveau compte médecin."
                    backHref="/dashboard/admin/comptes"
                />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Identifiant" value={identifier} onValueChange={setIdentifier} isRequired />
                    <Input label="Nom" value={name} onValueChange={setName} />
                    <Input label="Mot de passe" type="password" value={password} onValueChange={setPassword} isRequired />
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
                        placeholder="5f... , 6a..."
                    />
                    <Switch isSelected={isActive} onValueChange={setIsActive}>
                        Actif
                    </Switch>
                    <Button color="primary" type="submit" isLoading={loading}>
                        Créer
                    </Button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default DoctorsCreate;
