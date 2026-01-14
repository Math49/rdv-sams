import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardBody, Spinner } from '@heroui/react';

import { PatientLayout } from '@/Layouts/PatientLayout';
import { VmCard } from '@/Components/patient/VmCard';
import { SpecialtyCard } from '@/Components/patient/SpecialtyCard';
import { api } from '@/lib/api';
import type { ApiResponse, Calendar, Doctor } from '@/lib/types';

type DoctorShowProps = {
    doctorId: string;
};

const DoctorShow = ({ doctorId }: DoctorShowProps) => {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
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
        router.visit(`/patient/book/${calendarId}`);
    };

    const vmCalendar = calendars.find((calendar) => calendar.scope === 'doctor') || null;
    const specialtyCalendars = calendars.filter((calendar) => calendar.scope === 'specialty');

    return (
        <PatientLayout>
            <Head title="Medecin" />
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card className="border border-white/10 bg-white/5">
                        <CardBody>
                            <h2 className="text-xl font-semibold">{doctor?.name || doctor?.identifier}</h2>
                            <p className="text-sm text-foreground/70">
                                Selectionnez un calendrier pour prendre rendez-vous.
                            </p>
                        </CardBody>
                    </Card>

                    {vmCalendar ? (
                        <VmCard calendar={vmCalendar} onSelect={() => handleSelect(vmCalendar._id || vmCalendar.id || '')} />
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
