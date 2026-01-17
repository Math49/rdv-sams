import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { AppointmentTypeCard } from '@/Components/patient/AppointmentTypeCard';
import { PatientLayout } from '@/Layouts/PatientLayout';
import { patientApi } from '@/lib/api';
import type { ApiResponse, Calendar, Doctor, PatientTokenContext } from '@/lib/types';

const AppointmentHome = () => {
    const [context, setContext] = useState<PatientTokenContext | null>(null);
    const [loadingContext, setLoadingContext] = useState(true);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContext = async () => {
            try {
                const response = await patientApi.getContext();
                setContext((response.data as ApiResponse<PatientTokenContext>).data);
            } catch {
                setContext(null);
            } finally {
                setLoadingContext(false);
            }
        };

        loadContext();
    }, []);

    const doctorId = context?.doctorId || '';

    useEffect(() => {
        if (!doctorId) {
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const [doctorRes, calendarsRes] = await Promise.all([
                    patientApi.getDoctor(doctorId),
                    patientApi.getCalendars(doctorId),
                ]);
                setDoctor((doctorRes.data as ApiResponse<Doctor>).data);
                setCalendars((calendarsRes.data as ApiResponse<Calendar[]>).data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [doctorId]);

    if (loadingContext) {
        return (
            <PatientLayout>
                <Head title="Prise de RDV" />
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            </PatientLayout>
        );
    }

    if (!doctorId) {
        return (
            <PatientLayout>
                <Head title="Prise de RDV" />
                <Card className="border border-sams-border bg-sams-surface">
                    <CardBody className="space-y-3">
                        <p className="text-sm text-sams-muted">
                            Le token patient est manquant ou expiré. Veuillez revenir à la page d'accès.
                        </p>
                        <Button color="primary" onPress={() => router.visit('/')}>
                            Retour
                        </Button>
                    </CardBody>
                </Card>
            </PatientLayout>
        );
    }

    const handleSelect = (calendarId: string) => {
        router.visit(`/prise-rdv/${calendarId}`);
    };

    const vmCalendar = calendars.find((calendar) => calendar.scope === 'doctor') || null;
    const specialtyCalendars = calendars.filter((calendar) => calendar.scope === 'specialty');

    const noCalendars = !vmCalendar && specialtyCalendars.length === 0;

    return (
        <PatientLayout>
            <Head title="Prise de RDV" />
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card className="border border-sams-border bg-sams-surface">
                        <CardBody className="space-y-2">
                            <h2 className="text-xl font-semibold">
                                {doctor?.name || doctor?.identifier || 'Médecin'}
                            </h2>
                            <p className="text-sm text-sams-muted">
                                Choisissez un type de rendez-vous pour afficher les créneaux.
                            </p>
                        </CardBody>
                    </Card>

                    {noCalendars ? (
                        <Card className="border border-sams-border bg-sams-surface">
                            <CardBody>
                                <p className="text-sm text-sams-muted">
                                    Aucun calendrier disponible pour ce médecin. Veuillez contacter le secrétariat.
                                </p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {vmCalendar ? (
                                <AppointmentTypeCard
                                    title="Visite médicale"
                                    description={vmCalendar.label || 'Calendrier médecin'}
                                    actionLabel="Choisir"
                                    onSelect={() => handleSelect(vmCalendar._id || vmCalendar.id || '')}
                                />
                            ) : null}
                            {specialtyCalendars.map((calendar) => (
                                <AppointmentTypeCard
                                    key={calendar._id || calendar.id}
                                    title={calendar.label || 'Spécialité'}
                                    description="Consultation spécialisée"
                                    actionLabel="Choisir"
                                    onSelect={() => handleSelect(calendar._id || calendar.id || '')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PatientLayout>
    );
};

export default AppointmentHome;
