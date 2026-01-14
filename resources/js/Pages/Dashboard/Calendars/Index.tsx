import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api } from '@/lib/api';
import type { ApiResponse, Calendar } from '@/lib/types';

const CalendarsIndex = () => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<Calendar[]>>('/api/calendars');
                setCalendars(response.data.data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <DashboardLayout>
            <Head title="Calendriers" />
            <div className="space-y-6">
                <PageHeader title="Calendriers" subtitle="Gerez vos calendriers et leurs reglages." />
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {calendars.map((calendar) => {
                            const id = calendar._id || calendar.id || '';
                            return (
                                <Card key={id} className="border border-white/10 bg-white/5">
                                    <CardBody className="space-y-3">
                                        <div>
                                            <p className="text-xs uppercase text-foreground/60">{calendar.scope}</p>
                                            <h3 className="text-lg font-semibold">
                                                {calendar.label || 'Calendrier'}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button as={Link} href={`/dashboard/calendars/${id}`} variant="flat" size="sm">
                                                Details
                                            </Button>
                                            <Button
                                                as={Link}
                                                href={`/dashboard/calendars/${id}/rules`}
                                                variant="flat"
                                                size="sm"
                                            >
                                                Regles
                                            </Button>
                                            <Button
                                                as={Link}
                                                href={`/dashboard/calendars/${id}/exceptions`}
                                                variant="flat"
                                                size="sm"
                                            >
                                                Exceptions
                                            </Button>
                                            <Button
                                                as={Link}
                                                href={`/dashboard/calendars/${id}/appointment-types`}
                                                variant="flat"
                                                size="sm"
                                            >
                                                Types
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CalendarsIndex;
