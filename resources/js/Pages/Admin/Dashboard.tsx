import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';

const AdminDashboard = () => {
    return (
        <AdminLayout>
            <Head title="Admin" />
            <div className="space-y-6">
                <PageHeader title="Dashboard admin" subtitle="Acces rapide aux modules administratifs." />
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border border-white/10 bg-white/5">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">Medecins</h3>
                            <Button as={Link} href="/dashboard/admin/doctors" color="primary">
                                Gerer
                            </Button>
                        </CardBody>
                    </Card>
                    <Card className="border border-white/10 bg-white/5">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">SAMS</h3>
                            <Button as={Link} href="/dashboard/admin/sams" color="primary">
                                Gerer
                            </Button>
                        </CardBody>
                    </Card>
                    <Card className="border border-white/10 bg-white/5">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">Rendez-vous</h3>
                            <Button as={Link} href="/dashboard/admin/appointments" color="primary">
                                Voir
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
