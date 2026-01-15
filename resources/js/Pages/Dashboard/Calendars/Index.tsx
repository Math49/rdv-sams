import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Head } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';

import { AppointmentDetailsDrawer } from '@/Components/dashboard/AppointmentDetailsDrawer';
import { DoctorFilterModal } from '@/Components/dashboard/DoctorFilterModal';
import { SamsEventDetailsModal } from '@/Components/dashboard/SamsEventDetailsModal';
import { TransferAppointmentModal } from '@/Components/dashboard/TransferAppointmentModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { PageHeader } from '@/Components/ui/PageHeader';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { useIsAdmin } from '@/hooks/useAuth';
import { adminApi, api } from '@/lib/api';
import { formatDateTimeFR, toIsoUtc } from '@/lib/date';
import type { ApiResponse, Appointment, Calendar, Doctor, SamsEvent, Specialty } from '@/lib/types';

const viewOptions = [
    { key: 'dayGridMonth', label: 'Mois' },
    { key: 'timeGridWeek', label: 'Semaine' },
    { key: 'timeGridDay', label: 'Jour' },
    { key: 'listWeek', label: 'Agenda' },
] as const;

type CalendarView = (typeof viewOptions)[number]['key'];

type ViewRange = {
    start: Date;
    end: Date;
};

const getEventTextColor = (hexColor?: string | null) => {
    if (!hexColor || !hexColor.startsWith('#') || hexColor.length !== 7) {
        return '#0B0B0B';
    }

    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance > 0.6 ? '#0B0B0B' : '#F8FAFC';
};

const isAllDayEvent = (startAt: string, endAt?: string | null) => {
    const start = dayjs(startAt);
    if (!start.isValid()) return false;
    const end = endAt ? dayjs(endAt) : null;
    const startMidnight = start.hour() === 0 && start.minute() === 0 && start.second() === 0;
    const endMidnight = end ? end.hour() === 0 && end.minute() === 0 && end.second() === 0 : true;

    return startMidnight && endMidnight;
};

const CalendarsIndex = () => {
    const isAdmin = useIsAdmin();
    const calendarRef = useRef<FullCalendar | null>(null);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [samsEvents, setSamsEvents] = useState<SamsEvent[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [specialties, setSpecialties] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
    const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
    const [includeDoctorScope, setIncludeDoctorScope] = useState(true);
    const [loading, setLoading] = useState(true);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [viewTitle, setViewTitle] = useState('');
    const [activeView, setActiveView] = useState<CalendarView>('timeGridWeek');
    const [viewRange, setViewRange] = useState<ViewRange | null>(null);
    const viewRangeRef = useRef<ViewRange | null>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [doctorFilterOpen, setDoctorFilterOpen] = useState(false);
    const [samsDetailsOpen, setSamsDetailsOpen] = useState(false);
    const [selectedSamsEvent, setSelectedSamsEvent] = useState<SamsEvent | null>(null);
    const [transferOpen, setTransferOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const loadCalendars = useCallback(async () => {
        const response = await api.get<ApiResponse<Calendar[]>>('/api/calendars');
        setCalendars(response.data.data);
    }, []);

    const loadAppointments = useCallback(
        async (range: ViewRange) => {
            setAppointmentsLoading(true);
            try {
                const params: Record<string, string | string[]> = {
                    from: toIsoUtc(range.start),
                    to: toIsoUtc(range.end),
                };

                if (isAdmin && selectedDoctorIds.length > 0) {
                    params.doctorIds = selectedDoctorIds;
                }

                const response = await api.get<ApiResponse<Appointment[]>>('/api/appointments', { params });
                setAppointments(response.data.data);
            } finally {
                setAppointmentsLoading(false);
            }
        },
        [isAdmin, selectedDoctorIds],
    );

    const loadDoctors = useCallback(async () => {
        const response = await api.get<ApiResponse<Doctor[]>>('/api/doctors');
        setDoctors(response.data.data);
    }, []);

    const loadSpecialties = useCallback(async () => {
        if (!isAdmin) {
            setSpecialties([]);
            return;
        }
        const response = await adminApi.specialties();
        const items = ((response.data as ApiResponse<Specialty[]>).data || [])
            .map((specialty) => ({
                id: specialty._id || specialty.id || '',
                label: specialty.label,
            }))
            .filter((item) => item.id.length > 0)
            .sort((a, b) => a.label.localeCompare(b.label));
        setSpecialties(items);
    }, [isAdmin]);

    const loadSamsEvents = useCallback(async (range?: ViewRange | null) => {
        const params = range
            ? {
                  from: toIsoUtc(range.start),
                  to: toIsoUtc(range.end),
              }
            : undefined;
        const response = await api.get<ApiResponse<SamsEvent[]>>('/api/sams/events', { params });
        setSamsEvents(response.data.data);
    }, []);

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                await Promise.all([loadCalendars(), loadDoctors(), loadSpecialties()]);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, [loadCalendars, loadDoctors, loadSpecialties]);

    useEffect(() => {
        if (doctors.length === 0) return;
        setSelectedDoctorIds((current) => {
            if (current.length > 0) return current;
            return doctors
                .map((doctor) => doctor._id || doctor.id || '')
                .filter((id) => id.length > 0);
        });
    }, [doctors]);


    useEffect(() => {
        const range = viewRangeRef.current;
        if (!range) return;
        loadAppointments(range);
    }, [loadAppointments]);


    const appointmentById = useMemo(() => {
        return new Map<string, Appointment>(
            appointments
                .map((appointment) => [appointment._id || appointment.id || '', appointment] as const)
                .filter(([id]) => Boolean(id)),
        );
    }, [appointments]);

    const samsEventById = useMemo(() => {
        return new Map<string, SamsEvent>(
            samsEvents
                .map((event) => [`sams-${event._id || event.id || ''}`, event] as const)
                .filter(([id]) => Boolean(id)),
        );
    }, [samsEvents]);

    const calendarMap = useMemo(() => {
        return new Map<string, Calendar>(
            calendars
                .map((calendar) => [calendar._id || calendar.id || '', calendar] as const)
                .filter(([id]) => Boolean(id)),
        );
    }, [calendars]);

    const doctorMap = useMemo(() => {
        return new Map<string, Doctor>(
            doctors
                .map((doctor) => [doctor._id || doctor.id || '', doctor] as const)
                .filter(([id]) => Boolean(id)),
        );
    }, [doctors]);

    const derivedSpecialties = useMemo(() => {
        const map = new Map<string, string>();
        calendars.forEach((calendar) => {
            if (calendar.scope !== 'specialty' || !calendar.specialtyId) return;
            if (!map.has(calendar.specialtyId)) {
                map.set(calendar.specialtyId, calendar.label || 'Specialite');
            }
        });
        return Array.from(map.entries())
            .map(([id, label]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [calendars]);

    const specialtyOptions = specialties.length > 0 ? specialties : derivedSpecialties;

    useEffect(() => {
        if (specialtyOptions.length === 0) return;
        setSelectedSpecialtyIds((current) => {
            if (current.length > 0) return current;
            return specialtyOptions.map((option) => option.id);
        });
    }, [specialtyOptions]);

    const filteredAppointments = useMemo(() => {
        if (selectedDoctorIds.length === 0) return [];
        const doctorSelection = new Set(selectedDoctorIds);
        const specialtySelection = new Set(selectedSpecialtyIds);

        return appointments.filter((appointment) => {
            if (!doctorSelection.has(appointment.doctorId)) return false;
            const calendar = calendarMap.get(appointment.calendarId);
            if (!calendar) return false;
            if (calendar.scope === 'doctor') {
                return includeDoctorScope;
            }
            if (calendar.scope === 'specialty') {
                return calendar.specialtyId ? specialtySelection.has(calendar.specialtyId) : false;
            }
            return false;
        });
    }, [appointments, selectedDoctorIds, selectedSpecialtyIds, includeDoctorScope, calendarMap]);

    const appointmentEvents = useMemo<EventInput[]>(() => {
        return filteredAppointments.map((appointment) => {
            const id = appointment._id || appointment.id || '';
            const calendar = calendarMap.get(appointment.calendarId);
            const doctor = doctorMap.get(appointment.doctorId);
            const doctorLabel = doctor?.name || doctor?.identifier || appointment.doctorId;
            const patientName = appointment.patient
                ? `${appointment.patient.firstname ?? ''} ${appointment.patient.lastname ?? ''}`.trim()
                : 'Patient';
            const baseTitle = calendar?.label ? `${patientName} - ${calendar.label}` : patientName;
            const title = doctorLabel ? `${baseTitle} (Dr ${doctorLabel})` : baseTitle;
            const color = calendar?.color || '#2563EB';

            return {
                id,
                title: title || 'RDV',
                start: appointment.startAt,
                end: appointment.endAt,
                backgroundColor: color,
                borderColor: color,
                textColor: getEventTextColor(color),
                extendedProps: { kind: 'appointment' },
            };
        });
    }, [filteredAppointments, calendarMap, doctorMap]);

    const samsEventItems = useMemo<EventInput[]>(() => {
        return samsEvents.map((event) => {
            const id = event._id || event.id || '';
            const allDay = isAllDayEvent(event.startAt, event.endAt);
            return {
                id: `sams-${id}`,
                title: event.title || 'SAMS',
                start: event.startAt,
                end: event.endAt,
                allDay,
                backgroundColor: '#94A3B8',
                borderColor: '#CBD5F5',
                textColor: '#0B0B0B',
                extendedProps: {
                    kind: 'sams',
                    description: event.description,
                    location: event.location,
                },
            };
        });
    }, [samsEvents]);

    const events = useMemo<EventInput[]>(() => {
        return [...appointmentEvents, ...samsEventItems];
    }, [appointmentEvents, samsEventItems]);

    const handleDatesSet = (info: DatesSetArg) => {
        setViewTitle(info.view.title);
        setActiveView(info.view.type as CalendarView);
        const range = { start: info.start, end: info.end };
        viewRangeRef.current = range;
        setViewRange(range);
        loadAppointments(range);
        loadSamsEvents(range);
    };

    const handleEventClick = (info: EventClickArg) => {
        if (info.event.extendedProps?.kind === 'sams') {
            const target = samsEventById.get(info.event.id);
            if (!target) return;
            setSelectedSamsEvent(target);
            setSamsDetailsOpen(true);
            return;
        }
        const appointment = appointmentById.get(info.event.id);
        if (!appointment) return;
        setSelectedAppointment(appointment);
        setDrawerOpen(true);
    };

    const handleEventDidMount = (info: EventMountArg) => {
        info.el.style.cursor = 'pointer';
        const start = info.event.start ? formatDateTimeFR(info.event.start) : '';
        const end = info.event.end ? formatDateTimeFR(info.event.end) : '';
        const range = end ? `${start} - ${end}` : start;
        info.el.title = range ? `${info.event.title} (${range})` : info.event.title;
    };

    const handleDoctorApply = (ids: string[]) => {
        setSelectedDoctorIds(ids);
    };

    const toggleSpecialty = (id: string) => {
        setSelectedSpecialtyIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
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

    const handleCancelAppointment = async () => {
        if (!selectedAppointment?._id && !selectedAppointment?.id) return;
        setCancelLoading(true);
        try {
            const id = selectedAppointment._id || selectedAppointment.id || '';
            await api.post(`/api/appointments/${id}/cancel`, {});
            setCancelOpen(false);
            if (viewRange) {
                await loadAppointments(viewRange);
            }
        } finally {
            setCancelLoading(false);
        }
    };

    const selectedCalendar = selectedAppointment
        ? calendarMap.get(selectedAppointment.calendarId)
        : null;
    const calendarLabel = selectedCalendar
        ? selectedCalendar.label ||
          (selectedCalendar.scope === 'doctor'
              ? 'Visite medicale'
              : selectedCalendar.scope === 'specialty'
                ? 'Specialite'
                : 'SAMS')
        : null;
    const doctorLabel = selectedAppointment
        ? (doctorMap.get(selectedAppointment.doctorId)?.name ||
              doctorMap.get(selectedAppointment.doctorId)?.identifier ||
              null)
        : null;

    return (
        <DashboardLayout>
            <Head title="Calendriers" />
            <div className="space-y-6">
                <PageHeader title="Calendriers" subtitle="Vue globale des RDV par soignant." />

                <div className="calendar-shell p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-neutral-400">{viewTitle || 'Calendrier'}</p>
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button size="sm" variant="flat" onPress={() => setDoctorFilterOpen(true)} isDisabled={loading}>
                                Soignants ({selectedDoctorIds.length}/{doctors.length})
                            </Button>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={includeDoctorScope ? 'solid' : 'flat'}
                                    onPress={() => setIncludeDoctorScope((current) => !current)}
                                >
                                    VM
                                </Button>
                                {specialtyOptions.map((specialty) => (
                                    <Button
                                        key={specialty.id}
                                        size="sm"
                                        variant={selectedSpecialtyIds.includes(specialty.id) ? 'solid' : 'flat'}
                                        onPress={() => toggleSpecialty(specialty.id)}
                                    >
                                        {specialty.label}
                                    </Button>
                                ))}
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
                    </div>
                    <Card className="mt-4 border border-neutral-800 bg-neutral-900/60">
                        <CardBody className="relative">
                            {appointmentsLoading ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                                    <Spinner />
                                </div>
                            ) : null}
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
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
                                eventDidMount={handleEventDidMount}
                                datesSet={handleDatesSet}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <AppointmentDetailsDrawer
                isOpen={drawerOpen}
                appointment={selectedAppointment}
                calendarLabel={calendarLabel}
                doctorName={doctorLabel}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedAppointment(null);
                }}
                onTransfer={() => setTransferOpen(true)}
                onCancel={() => setCancelOpen(true)}
            />

            <TransferAppointmentModal
                isOpen={transferOpen}
                appointmentId={selectedAppointment?._id || selectedAppointment?.id || null}
                doctors={doctors}
                onClose={() => setTransferOpen(false)}
                onTransferred={() => viewRange && loadAppointments(viewRange)}
            />

            <ConfirmDialog
                isOpen={cancelOpen}
                title="Annuler le rendez-vous"
                description="Confirmez l annulation du rendez-vous selectionne."
                confirmLabel="Annuler"
                confirmColor="danger"
                isLoading={cancelLoading}
                onClose={() => setCancelOpen(false)}
                onConfirm={handleCancelAppointment}
            />

            <DoctorFilterModal
                isOpen={doctorFilterOpen}
                doctors={doctors}
                selectedIds={selectedDoctorIds}
                onClose={() => setDoctorFilterOpen(false)}
                onApply={(ids) => {
                    handleDoctorApply(ids);
                    setDoctorFilterOpen(false);
                }}
            />

            <SamsEventDetailsModal
                isOpen={samsDetailsOpen}
                event={selectedSamsEvent}
                onClose={() => {
                    setSamsDetailsOpen(false);
                    setSelectedSamsEvent(null);
                }}
            />
        </DashboardLayout>
    );
};

export default CalendarsIndex;
