import { FormEvent, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner, Textarea } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api } from '@/lib/api';
import type { ApiResponse, Calendar } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type CalendarShowProps = {
    calendarId: string;
};

const CalendarShow = ({ calendarId }: CalendarShowProps) => {
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { success } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<Calendar[]>>('/api/calendars');
                const found = response.data.data.find(
                    (item) => (item._id || item.id) === calendarId,
                );
                setCalendar(found || null);
                setMessage(found?.message || '');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [calendarId]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!calendar) return;
        setSaving(true);
        try {
            await api.patch(`/api/calendars/${calendarId}/message`, { message });
            success('Message mis a jour');
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Calendrier" />
            <div className="space-y-6">
                <PageHeader title="Calendrier" subtitle="Mettez a jour le message envoye au patient." />
                {loading ? (
                    <Spinner />
                ) : (
                    <Card className="border border-white/10 bg-white/5">
                        <CardBody className="space-y-4">
                            <p className="text-sm text-foreground/70">
                                Calendrier: {calendar?.label || calendar?.scope}
                            </p>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                    label="Message template"
                                    value={message}
                                    onValueChange={setMessage}
                                    description="Utilisez {{TOKEN}} pour inserer le token."
                                />
                                <Button color="primary" type="submit" isLoading={saving}>
                                    Enregistrer
                                </Button>
                            </form>
                        </CardBody>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CalendarShow;
