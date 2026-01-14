import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/lib/types';

const DoctorsIndex = () => {
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<User[]>>('/api/admin/doctors');
                setDoctors(response.data.data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <AdminLayout>
            <Head title="Medecins" />
            <div className="space-y-6">
                <PageHeader
                    title="Medecins"
                    subtitle="Creer et gerer les comptes medecins."
                    actions={
                        <Button as={Link} href="/dashboard/admin/doctors/create" color="primary">
                            Nouveau medecin
                        </Button>
                    }
                />
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {doctors.map((doctor) => {
                            const id = doctor._id || doctor.id || '';
                            return (
                                <Card key={id} className="border border-white/10 bg-white/5">
                                    <CardBody className="space-y-3">
                                        <div>
                                            <p className="text-sm text-foreground/70">{doctor.identifier}</p>
                                            <h3 className="text-lg font-semibold">{doctor.name || 'Medecin'}</h3>
                                        </div>
                                        <Button as={Link} href={`/dashboard/admin/doctors/${id}/edit`} variant="flat">
                                            Modifier
                                        </Button>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default DoctorsIndex;
