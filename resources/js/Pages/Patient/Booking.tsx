import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Spinner,
} from '@heroui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';

import { PatientLayout } from '@/Layouts/PatientLayout';
import { PatientForm } from '@/Components/patient/PatientForm';
import { api } from '@/lib/api';
import { formatDateTimeFR, toIsoUtc } from '@/lib/date';
import { clearPatientContext, getPatientContext } from '@/lib/patient';
import type { ApiResponse, AppointmentType, AvailabilitySlot, PatientInfo } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type BookingProps = {
    calendarId: string;
};

type ViewRange = {
    start: Date;
    end: Date;
};

const viewOptions = [
    { key: 'timeGridWeek', label: 'Semaine' },
    { key: 'timeGridDay', label: 'Jour' },
] as const;

type CalendarView = (typeof viewOptions)[number]['key'];

const Booking = ({ calendarId }: BookingProps) => {
    const context = getPatientContext();
    const doctorId = context?.doctorId || '';
    const { success, error } = useToast();
    const calendarRef = useRef<FullCalendar | null>(null);

    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [appointmentTypeId, setAppointmentTypeId] = useState('');
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
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
    const [viewTitle, setViewTitle] = useState('');
    const [activeView, setActiveView] = useState<CalendarView>('timeGridWeek');
    const [viewRange, setViewRange] = useState<ViewRange | null>(null);

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

    useEffect(() => {
        const loadSlots = async () => {
            if (!doctorId || !appointmentTypeId || !viewRange) return;
            setLoadingSlots(true);
            try {
                const response = await api.get<ApiResponse<AvailabilitySlot[]>>('/api/patient/availability/slots', {
                    params: {
                        doctorId,
                        calendarId,
                        appointmentTypeId,
                        from: toIsoUtc(viewRange.start),
                        to: toIsoUtc(viewRange.end),
                    },
                });
                setSlots(response.data.data);
                setSelectedSlot(null);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [doctorId, calendarId, appointmentTypeId, viewRange]);

    const slotById = useMemo(() => {
        return new Map(slots.map((slot) => [slot.startAt, slot]));
    }, [slots]);

    const events = useMemo<EventInput[]>(() => {
        return slots.map((slot) => ({
            id: slot.startAt,
            title: 'Disponible',
            start: slot.startAt,
            end: slot.endAt,
            classNames: ['fc-available-slot'],
            backgroundColor: 'rgba(59, 130, 246, 0.18)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            textColor: '#E2E8F0',
        }));
    }, [slots]);

    const handleDatesSet = (info: DatesSetArg) => {
        setViewTitle(info.view.title);
        setActiveView(info.view.type as CalendarView);
        setViewRange({ start: info.start, end: info.end });
    };

    const handleEventClick = (info: EventClickArg) => {
        const slot = slotById.get(info.event.id);
        if (!slot) return;
        setSelectedSlot(slot);
        setModalOpen(true);
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        if (direction === 'prev') api.prev();
        if (direction === 'next') api.next();
        if (direction === 'today') api.today();
    };

    const handleViewChange = (view: CalendarView) => {
        calendarRef.current?.getApi()?.changeView(view);
    };

    const handleSubmit = async () => {
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
            setModalOpen(false);
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

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedSlot(null);
    };

    return (
        <PatientLayout>
            <Head title="Prise de RDV" />
            <div className="space-y-6">
                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-4">
                        <h2 className="text-xl font-semibold">Prendre un rendez-vous</h2>
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
                                        <SelectItem key={id}>
                                            {type.label}
                                        </SelectItem>
                                    );
                                })}
                            </Select>
                        )}
                    </CardBody>
                </Card>

                <div className="calendar-shell p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-foreground/60">{viewTitle || 'Calendrier'}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('today')}>
                                    Aujourd hui
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('prev')}>
                                    Prec
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('next')}>
                                    Suiv
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {viewOptions.map((view) => (
                                <Button
                                    key={view.key}
                                    size="sm"
                                    variant={activeView === view.key ? 'solid' : 'flat'}
                                    onPress={() => handleViewChange(view.key)}
                                >
                                    {view.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Card className="mt-4 border border-white/10 bg-black/30">
                        <CardBody className="relative">
                            {loadingSlots ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                                    <Spinner />
                                </div>
                            ) : null}
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar={false}
                                nowIndicator
                                height="auto"
                                expandRows
                                dayMaxEventRows={3}
                                slotMinTime="00:00:00"
                                slotMaxTime="23:59:59"
                                events={events}
                                eventClick={handleEventClick}
                                datesSet={handleDatesSet}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={handleCloseModal} backdrop="blur" size="lg">
                <ModalContent>
                    <ModalHeader>Prendre rendez-vous</ModalHeader>
                    <ModalBody className="space-y-4">
                        {selectedSlot ? (
                            <div className="rounded-large border border-white/10 bg-white/5 px-4 py-3 text-sm">
                                Creneau selectionne: {formatDateTimeFR(selectedSlot.startAt)} -{' '}
                                {formatDateTimeFR(selectedSlot.endAt)}
                            </div>
                        ) : null}
                        <PatientForm value={patient} onChange={setPatient} />
                    </ModalBody>
                    <ModalFooter className="gap-2">
                        <Button variant="light" onPress={handleCloseModal}>
                            Annuler
                        </Button>
                        <Button color="primary" onPress={handleSubmit} isDisabled={!selectedSlot || submitting} isLoading={submitting}>
                            Valider
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </PatientLayout>
    );
};

export default Booking;
