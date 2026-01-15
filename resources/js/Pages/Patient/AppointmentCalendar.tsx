import { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, CardBody, Select, SelectItem, Spinner } from '@heroui/react';
import dayjs from 'dayjs';

import { GoogleLikeBookingLayout } from '@/Components/patient/GoogleLikeBookingLayout';
import { PatientAppointmentModal } from '@/Components/patient/PatientAppointmentModal';
import { PatientLayout } from '@/Layouts/PatientLayout';
import { patientApi } from '@/lib/api';
import { toIsoUtc } from '@/lib/date';
import { clearPatientContext, getPatientDoctorId } from '@/lib/patient';
import type {
    ApiResponse,
    AppointmentType,
    AvailabilitySlot,
    Doctor,
    PatientInfo,
} from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type AppointmentCalendarProps = {
    calendarId: string;
};

const startOfWeek = (date: dayjs.Dayjs) => {
    const day = date.day();
    const diff = (day + 6) % 7;
    return date.subtract(diff, 'day').startOf('day');
};

const AppointmentCalendar = ({ calendarId }: AppointmentCalendarProps) => {
    const doctorId = getPatientDoctorId() || '';
    const { success, error } = useToast();

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [appointmentTypeId, setAppointmentTypeId] = useState('');
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [patient, setPatient] = useState<PatientInfo>({
        lastname: '',
        firstname: '',
        phone: '',
        company: '',
    });
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!doctorId) return;
        const loadDoctor = async () => {
            const response = await patientApi.getDoctor(doctorId);
            setDoctor((response.data as ApiResponse<Doctor>).data);
        };
        loadDoctor();
    }, [doctorId]);

    useEffect(() => {
        const loadTypes = async () => {
            setLoadingTypes(true);
            try {
                const response = await patientApi.getAppointmentTypes(calendarId);
                const data = (response.data as ApiResponse<AppointmentType[]>).data;
                const active = data.filter((type) => type.isActive);
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

    const weekRange = useMemo(() => {
        const start = startOfWeek(dayjs(selectedDate));
        const end = start.add(6, 'day').endOf('day');
        return { start, end };
    }, [selectedDate]);

    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, index) => weekRange.start.add(index, 'day').toDate());
    }, [weekRange]);

    useEffect(() => {
        const loadSlots = async () => {
            if (!doctorId || !appointmentTypeId) return;
            setLoadingSlots(true);
            try {
                const response = await patientApi.getSlots({
                    doctorId,
                    calendarId,
                    appointmentTypeId,
                    from: toIsoUtc(weekRange.start.toDate()),
                    to: toIsoUtc(weekRange.end.toDate()),
                });
                setSlots((response.data as ApiResponse<AvailabilitySlot[]>).data);
                setSelectedSlot(null);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [doctorId, calendarId, appointmentTypeId, weekRange]);

    if (!doctorId) {
        return (
            <PatientLayout>
                <Head title="Prise de RDV" />
                <Card className="border border-neutral-800 bg-neutral-900">
                    <CardBody className="space-y-3">
                        <p className="text-sm text-neutral-400">
                            Le token patient est manquant ou expire. Veuillez revenir a la page d acces.
                        </p>
                        <Button color="primary" onPress={() => router.visit('/')}>
                            Retour
                        </Button>
                    </CardBody>
                </Card>
            </PatientLayout>
        );
    }

    const selectedType =
        appointmentTypes.find((type) => (type._id || type.id || '') === appointmentTypeId) || null;

    const handleSelectSlot = (slot: AvailabilitySlot) => {
        setSelectedSlot(slot);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !appointmentTypeId) return;
        setSubmitting(true);
        try {
            await patientApi.createAppointment({
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
            setModalOpen(false);
            setTimeout(() => router.visit('/'), 1000);
        } catch {
            error('Impossible de reserver ce creneau');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PatientLayout>
            <Head title="Prise de RDV" />
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-neutral-400">Prise de rendez-vous</p>
                    <h1 className="text-2xl font-semibold text-white">
                        {doctor?.name || doctor?.identifier || 'Medecin'}
                    </h1>
                </div>

                <div className="rounded-large border border-neutral-800 bg-neutral-900 p-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-400">
                                {selectedType
                                    ? `Rendez-vous de ${selectedType.durationMinutes} min`
                                    : 'Rendez-vous'}
                            </p>
                            <p className="text-sm text-neutral-300">Lieu: a confirmer</p>
                            <p className="text-sm text-neutral-400">
                                Selectionnez une heure disponible pour finaliser votre RDV.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {loadingTypes ? (
                                <Spinner size="sm" />
                            ) : appointmentTypes.length === 0 ? (
                                <p className="text-sm text-neutral-400">Aucun type de rendez-vous disponible.</p>
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
                                            <SelectItem key={id}>
                                                {type.label}
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {loadingSlots ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-large bg-black/40">
                            <Spinner />
                        </div>
                    ) : null}
                    <GoogleLikeBookingLayout
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        days={days}
                        slots={slots}
                        selectedSlotStart={selectedSlot?.startAt || null}
                        onSelectSlot={handleSelectSlot}
                    />
                </div>
            </div>

            <PatientAppointmentModal
                isOpen={modalOpen}
                slot={selectedSlot}
                appointmentType={selectedType}
                patient={patient}
                onChangePatient={setPatient}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedSlot(null);
                }}
                onSubmit={handleSubmit}
                loading={submitting}
            />
        </PatientLayout>
    );
};

export default AppointmentCalendar;
