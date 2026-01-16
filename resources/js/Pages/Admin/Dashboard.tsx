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
                    <Card className="border border-sams-border bg-sams-surface">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">Comptes</h3>
                            <Button as={Link} href="/dashboard/admin/comptes" color="primary">
                                Gérer
                            </Button>
                        </CardBody>
                    </Card>
                    <Card className="border border-sams-border bg-sams-surface">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">Calendrier SAMS</h3>
                            <Button as={Link} href="/dashboard/admin/calendrier-sams" color="primary">
                                Gérer
                            </Button>
                        </CardBody>
                    </Card>
                    <Card className="border border-sams-border bg-sams-surface">
                        <CardBody className="space-y-3">
                            <h3 className="text-lg font-semibold">Spécialités</h3>
                            <Button as={Link} href="/dashboard/admin/specialites" color="primary">
                                Gérer
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
