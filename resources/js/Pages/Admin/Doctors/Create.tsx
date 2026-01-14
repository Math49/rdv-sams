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
            success('Medecin cree');
            router.visit('/dashboard/admin/doctors');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Creer un medecin" />
            <div className="space-y-6">
                <PageHeader title="Creer un medecin" subtitle="Ajoutez un nouveau compte medecin." />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Identifiant" value={identifier} onValueChange={setIdentifier} isRequired />
                    <Input label="Nom" value={name} onValueChange={setName} />
                    <Input label="Mot de passe" type="password" value={password} onValueChange={setPassword} isRequired />
                    <Select
                        label="Roles"
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
                        <SelectItem key="doctor" value="doctor">
                            doctor
                        </SelectItem>
                        <SelectItem key="admin" value="admin">
                            admin
                        </SelectItem>
                    </Select>
                    <Input
                        label="Specialty IDs (separes par virgule)"
                        value={specialtyIds}
                        onValueChange={setSpecialtyIds}
                        placeholder="5f... , 6a..."
                    />
                    <Switch isSelected={isActive} onValueChange={setIsActive}>
                        Actif
                    </Switch>
                    <Button color="primary" type="submit" isLoading={loading}>
                        Creer
                    </Button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default DoctorsCreate;
