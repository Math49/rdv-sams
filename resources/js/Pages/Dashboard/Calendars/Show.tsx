import { FormEvent, useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Input, Spinner, Textarea } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { SectionCard } from '@/Components/ui/SectionCard';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api, calendarApi } from '@/lib/api';
import type { ApiResponse, Calendar } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type CalendarShowProps = {
    calendarId: string;
};

const CalendarShow = ({ calendarId }: CalendarShowProps) => {
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [message, setMessage] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [bookingMinHours, setBookingMinHours] = useState(0);
    const [bookingMaxDays, setBookingMaxDays] = useState(365);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingWindow, setSavingWindow] = useState(false);
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
                setColor(found?.color || '#3B82F6');
                setBookingMinHours(found?.bookingMinHours ?? 0);
                setBookingMaxDays(found?.bookingMaxDays ?? 365);
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
            await calendarApi.updateMessage(calendarId, { message, color });
            success('Configuration mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBookingWindow = async (event: FormEvent) => {
        event.preventDefault();
        if (!calendar) return;
        setSavingWindow(true);
        try {
            const response = await calendarApi.updateBookingWindow(calendarId, {
                bookingMinHours,
                bookingMaxDays,
            });
            setCalendar((response.data as ApiResponse<Calendar>).data);
            success('Fenêtre de réservation mise à jour');
        } finally {
            setSavingWindow(false);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Configuration calendrier" />
            <div className="space-y-6">
                <PageHeader
                    title="Configuration du calendrier"
                    subtitle="Gérez les paramètres de ce calendrier."
                    backHref="/dashboard"
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <div className="space-y-6">
                        <Card className="border border-sams-border bg-sams-surface">
                            <CardBody className="space-y-2">
                                <p className="text-sm text-sams-muted">Calendrier</p>
                                <h2 className="text-xl font-semibold">{calendar?.label || calendar?.scope}</h2>
                                {calendar?.color ? (
                                    <div className="flex items-center gap-2 text-sm text-sams-muted">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: calendar.color }}
                                        />
                                        Couleur actuelle
                                    </div>
                                ) : null}
                            </CardBody>
                        </Card>

                        <SectionCard
                            title="Disponibilités"
                            description="Définissez les heures disponibles et les exceptions."
                            actions={
                                <div className="flex gap-2">
                                    <Button as={Link} href={`/dashboard/config/${calendarId}/rules`} variant="flat" size="sm">
                                        Règles
                                    </Button>
                                    <Button
                                        as={Link}
                                        href={`/dashboard/config/${calendarId}/exceptions`}
                                        variant="flat"
                                        size="sm"
                                    >
                                        Exceptions
                                    </Button>
                                </div>
                            }
                        >
                            <p className="text-sm text-sams-muted">
                                Utilisez les règles pour définir les horaires de base et ajoutez des exceptions pour
                                ajuster un jour précis.
                            </p>
                        </SectionCard>

                        <SectionCard
                            title="Types de rendez-vous"
                            description="Durée, buffers et libellés."
                            actions={
                                <Button
                                    as={Link}
                                    href={`/dashboard/config/${calendarId}/appointment-types`}
                                    variant="flat"
                                    size="sm"
                                >
                                    Gérer
                                </Button>
                            }
                        >
                            <p className="text-sm text-sams-muted">
                                Configurez la durée et les buffers avant/après pour les rendez-vous.
                            </p>
                        </SectionCard>

                        <SectionCard
                            title="Fenêtre de réservation"
                            description="Définissez les limites de réservation pour les patients."
                        >
                            <form onSubmit={handleSaveBookingWindow} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        type="number"
                                        label="Délai minimum (heures)"
                                        description="Nombre d'heures minimum avant un RDV. Ex: 4 = pas de RDV dans les 4 prochaines heures."
                                        value={String(bookingMinHours)}
                                        onValueChange={(v) => setBookingMinHours(Math.max(0, parseInt(v) || 0))}
                                        min={0}
                                        max={720}
                                    />
                                    <Input
                                        type="number"
                                        label="Délai maximum (jours)"
                                        description="Nombre de jours maximum à l'avance. Ex: 30 = pas de RDV au-delà de 30 jours."
                                        value={String(bookingMaxDays)}
                                        onValueChange={(v) => setBookingMaxDays(Math.max(1, parseInt(v) || 1))}
                                        min={1}
                                        max={730}
                                    />
                                </div>
                                <div className="rounded-medium bg-sams-bg/50 p-3 text-sm text-sams-muted">
                                    <p>
                                        <strong>Aperçu :</strong> Les patients pourront réserver entre{' '}
                                        <span className="text-sams-text">
                                            {bookingMinHours === 0
                                                ? 'maintenant'
                                                : `dans ${bookingMinHours} heure${bookingMinHours > 1 ? 's' : ''}`}
                                        </span>{' '}
                                        et{' '}
                                        <span className="text-sams-text">
                                            {bookingMaxDays} jour{bookingMaxDays > 1 ? 's' : ''} à l'avance
                                        </span>
                                        .
                                    </p>
                                </div>
                                <Button color="primary" type="submit" isLoading={savingWindow}>
                                    Enregistrer la fenêtre
                                </Button>
                            </form>
                        </SectionCard>

                        <SectionCard
                            title="Couleur du calendrier"
                            description="Couleur des rendez-vous dans les calendriers."
                        >
                            <div className="flex flex-wrap items-center gap-4">
                                <Input
                                    type="color"
                                    label="Couleur"
                                    value={color}
                                    onValueChange={setColor}
                                />
                                <div className="text-sm text-sams-muted">
                                    <span className="mr-2">Apercu</span>
                                    <span className="inline-flex h-3 w-6 rounded-full" style={{ backgroundColor: color }} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Message patient"
                            description="Message envoyé lors de la génération du token."
                        >
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                    label="Message template"
                                    value={message}
                                    onValueChange={setMessage}
                                    description="Utilisez {{TOKEN}} pour insérer le token."
                                />
                                <Button color="primary" type="submit" isLoading={saving}>
                                    Enregistrer
                                </Button>
                            </form>
                        </SectionCard>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CalendarShow;
