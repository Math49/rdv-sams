import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { PatientLayout } from '@/Layouts/PatientLayout';
import { VmCard } from '@/Components/patient/VmCard';
import { SpecialtyCard } from '@/Components/patient/SpecialtyCard';
import { api, patientApi } from '@/lib/api';
import type { ApiResponse, Calendar, Doctor, PatientTokenContext } from '@/lib/types';

const DoctorShow = () => {
    const [context, setContext] = useState<PatientTokenContext | null>(null);
    const [loadingContext, setLoadingContext] = useState(true);
    const doctorId = context?.doctorId || '';

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

    useEffect(() => {
        if (!doctorId) {
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const [doctorRes, calendarsRes] = await Promise.all([
                    api.get<ApiResponse<Doctor>>(`/api/patient/doctors/${doctorId}`),
                    api.get<ApiResponse<Calendar[]>>(`/api/patient/doctors/${doctorId}/calendars`),
                ]);
                setDoctor(doctorRes.data.data);
                setCalendars(calendarsRes.data.data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [doctorId]);

    const handleSelect = (calendarId: string) => {
        router.visit(`/prise-rdv/${calendarId}`);
    };

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
                <Card className="border border-sams-border bg-sams-surface/70">
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

    const vmCalendar = calendars.find((calendar) => calendar.scope === 'doctor') || null;
    const specialtyCalendars = calendars.filter((calendar) => calendar.scope === 'specialty');

    return (
        <PatientLayout>
            <Head title="Prise de RDV" />
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card className="border border-sams-border bg-sams-surface/70">
                        <CardBody>
                            <h2 className="text-xl font-semibold">Dr. {doctor?.name || doctor?.identifier}</h2>
                            <p className="text-sm text-sams-muted">
                                Choisissez un type de rendez-vous pour afficher les créneaux.
                            </p>
                        </CardBody>
                    </Card>

                    {vmCalendar ? (
                        <VmCard
                            calendar={vmCalendar}
                            onSelect={() => handleSelect(vmCalendar._id || vmCalendar.id || '')}
                        />
                    ) : null}

                    {specialtyCalendars.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {specialtyCalendars.map((calendar) => (
                                <SpecialtyCard
                                    key={calendar._id || calendar.id}
                                    calendar={calendar}
                                    onSelect={() => handleSelect(calendar._id || calendar.id || '')}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            )}
        </PatientLayout>
    );
};

export default DoctorShow;
