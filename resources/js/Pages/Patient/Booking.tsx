import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, CardBody, Input, Select, SelectItem, Spinner } from '@heroui/react';

import { PatientLayout } from '@/Layouts/PatientLayout';
import { PatientForm } from '@/Components/patient/PatientForm';
import { SlotList } from '@/Components/patient/SlotList';
import { api } from '@/lib/api';
import { endOfDayUtc, formatDate, startOfDayUtc } from '@/lib/date';
import { clearPatientContext, getPatientContext } from '@/lib/patient';
import type { ApiResponse, AppointmentType, AvailabilitySlot, PatientInfo } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type BookingProps = {
    calendarId: string;
};

const Booking = ({ calendarId }: BookingProps) => {
    const context = getPatientContext();
    const { success, error } = useToast();

    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [appointmentTypeId, setAppointmentTypeId] = useState('');
    const [date, setDate] = useState(() => formatDate(new Date()));
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [patient, setPatient] = useState<PatientInfo>({
        lastname: '',
        firstname: '',
        phone: '',
        company: '',
    });
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const doctorId = context?.doctorId || '';

    useEffect(() => {
        const loadTypes = async () => {
            setLoadingTypes(true);
            try {
                const response = await api.get<ApiResponse<AppointmentType[]>>(
                    `/api/calendars/${calendarId}/appointment-types`,
                );
                const active = response.data.data.filter((type) => type.isActive);
                setAppointmentTypes(active);
                if (active.length > 0 && !appointmentTypeId) {
                    setAppointmentTypeId(active[0]._id || active[0].id || '');
                }
            } finally {
                setLoadingTypes(false);
            }
        };

        loadTypes();
    }, [calendarId]);

    const range = useMemo(() => {
        if (!date) return null;
        return {
            from: startOfDayUtc(date),
            to: endOfDayUtc(date),
        };
    }, [date]);

    useEffect(() => {
        const loadSlots = async () => {
            if (!doctorId || !calendarId || !appointmentTypeId || !range) return;
            setLoadingSlots(true);
            try {
                const response = await api.get<ApiResponse<AvailabilitySlot[]>>('/api/patient/availability/slots', {
                    params: {
                        doctorId,
                        calendarId,
                        appointmentTypeId,
                        from: range.from,
                        to: range.to,
                    },
                });
                setSlots(response.data.data);
                setSelectedSlot(null);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [doctorId, calendarId, appointmentTypeId, range]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedSlot) return;
        setSubmitting(true);
        try {
            await api.post('/api/patient/appointments', {
                calendarId,
                appointmentTypeId,
                startAt: selectedSlot.startAt,
                patient: {
                    lastname: patient.lastname,
                    firstname: patient.firstname,
                    phone: patient.phone,
                    company: patient.company || undefined,
                },
            });
            success('RDV pris avec succes');
            clearPatientContext();
            setTimeout(() => router.visit('/'), 1000);
        } catch {
            error('Impossible de reserver ce creneau');
        } finally {
            setSubmitting(false);
        }
    };

    if (!doctorId) {
        return (
            <PatientLayout>
                <Head title="Prise de RDV" />
                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-3">
                        <p className="text-sm text-foreground/70">
                            Le contexte patient est manquant. Veuillez renseigner votre token.
                        </p>
                        <Button color="primary" onPress={() => router.visit('/')}>
                            Retour
                        </Button>
                    </CardBody>
                </Card>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <Head title="Prise de RDV" />
            <div className="space-y-6">
                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-4">
                        <h2 className="text-xl font-semibold">Choisir un rendez-vous</h2>
                        {loadingTypes ? (
                            <Spinner />
                        ) : appointmentTypes.length === 0 ? (
                            <p className="text-sm text-foreground/60">Aucun type de rendez-vous disponible.</p>
                        ) : (
                            <Select
                                label="Type de rendez-vous"
                                selectedKeys={appointmentTypeId ? new Set([appointmentTypeId]) : new Set()}
                                onSelectionChange={(keys) => {
                                    if (keys === 'all') {
                                        const first = appointmentTypes[0];
                                        setAppointmentTypeId(first?._id || first?.id || '');
                                        return;
                                    }
                                    const first = Array.from(keys)[0];
                                    setAppointmentTypeId(first ? String(first) : '');
                                }}
                            >
                                {appointmentTypes.map((type) => {
                                    const id = type._id || type.id || '';
                                    return (
                                        <SelectItem key={id} value={id}>
                                            {type.label}
                                        </SelectItem>
                                    );
                                })}
                            </Select>
                        )}
                        <Input
                            type="date"
                            label="Date"
                            value={date}
                            onValueChange={setDate}
                            isRequired
                        />
                    </CardBody>
                </Card>

                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-4">
                        <h3 className="text-lg font-semibold">Creneaux disponibles</h3>
                        {loadingSlots ? (
                            <Spinner />
                        ) : (
                            <SlotList
                                slots={slots}
                                selected={selectedSlot?.startAt || null}
                                onSelect={setSelectedSlot}
                            />
                        )}
                    </CardBody>
                </Card>

                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-4">
                        <h3 className="text-lg font-semibold">Vos informations</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <PatientForm value={patient} onChange={setPatient} />
                            <Button
                                color="primary"
                                type="submit"
                                isDisabled={!selectedSlot || submitting}
                                isLoading={submitting}
                            >
                                Confirmer le RDV
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </PatientLayout>
    );
};

export default Booking;
