import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/date';
import type { ApiResponse, SamsEvent } from '@/lib/types';

const SamsIndex = () => {
    const [events, setEvents] = useState<SamsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<SamsEvent[]>>('/api/admin/sams/events');
                setEvents(response.data.data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <AdminLayout>
            <Head title="SAMS" />
            <div className="space-y-6">
                <PageHeader
                    title="Evenements SAMS"
                    subtitle="Gerez les evenements SAMS."
                    actions={
                        <Button as={Link} href="/dashboard/admin/sams/create" color="primary">
                            Nouvel evenement
                        </Button>
                    }
                />
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {events.map((event) => {
                            const id = event._id || event.id || '';
                            return (
                                <Card key={id} className="border border-white/10 bg-white/5">
                                    <CardBody className="space-y-2">
                                        <h3 className="text-lg font-semibold">{event.title}</h3>
                                        <p className="text-sm text-foreground/70">
                                            {formatDateTime(event.startAt)} - {formatDateTime(event.endAt)}
                                        </p>
                                        <Button as={Link} href={`/dashboard/admin/sams/${id}/edit`} variant="flat">
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

export default SamsIndex;
