import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Select, SelectItem, Spinner, Switch } from '@heroui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import type { SharedSelection } from '@heroui/system';

import { CalendarCard } from '@/Components/dashboard/CalendarCard';
import { AppointmentDetailsDrawer } from '@/Components/dashboard/AppointmentDetailsDrawer';
import { SamsEventDetailsModal } from '@/Components/dashboard/SamsEventDetailsModal';
import { GenerateTokenModal } from '@/Components/dashboard/GenerateTokenModal';
import { TransferAppointmentModal } from '@/Components/dashboard/TransferAppointmentModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { PageHeader } from '@/Components/ui/PageHeader';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { useIsAdmin } from '@/hooks/useAuth';
import { api, calendarApi, getAvailabilityFeed } from '@/lib/api';
import { formatDateTimeFR, PARIS_TZ, toIsoParis } from '@/lib/date';
import type { ApiResponse, Appointment, AppointmentType, AvailabilitySlot, Calendar, Doctor, SamsEvent } from '@/lib/types';

const viewOptions = [
    { key: 'dayGridMonth', label: 'Mois' },
    { key: 'timeGridWeek', label: 'Semaine' },
    { key: 'timeGridDay', label: 'Jour' },
    { key: 'listWeek', label: 'Agenda' },
] as const;

type CalendarView = (typeof viewOptions)[number]['key'];
type Selection = SharedSelection;

type ViewRange = {
    start: Date;
    end: Date;
};

const getEventTextColor = (hexColor?: string | null) => {
    if (!hexColor || !hexColor.startsWith('#') || hexColor.length !== 7) {
        return '#0B1220';
    }

    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance > 0.6 ? '#0B1220' : '#F8FAFC';
};

const isAllDayEvent = (startAt: string, endAt?: string | null) => {
    const start = dayjs.tz(startAt, PARIS_TZ);
    if (!start.isValid()) return false;
    const end = endAt ? dayjs.tz(endAt, PARIS_TZ) : null;
    const startMidnight = start.hour() === 0 && start.minute() === 0 && start.second() === 0;
    const endMidnight = end ? end.hour() === 0 && end.minute() === 0 && end.second() === 0 : true;

    return startMidnight && endMidnight;
};

const CalendarIndex = () => {
    const isAdmin = useIsAdmin();
    const calendarRef = useRef<FullCalendar | null>(null);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const [samsEvents, setSamsEvents] = useState<SamsEvent[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [calendarIds, setCalendarIds] = useState<string[]>([]);
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [appointmentTypeId, setAppointmentTypeId] = useState('');
    const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [viewTitle, setViewTitle] = useState('');
    const [activeView, setActiveView] = useState<CalendarView>('timeGridWeek');
    const [viewRange, setViewRange] = useState<ViewRange | null>(null);
    const viewRangeRef = useRef<ViewRange | null>(null);
    const [includeSams, setIncludeSams] = useState(true);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [samsDetailsOpen, setSamsDetailsOpen] = useState(false);
    const [selectedSamsEvent, setSelectedSamsEvent] = useState<SamsEvent | null>(null);
    const [tokenModalOpen, setTokenModalOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const selectedCalendarId = calendarIds.length === 1 ? calendarIds[0] : null;

    const loadCalendars = useCallback(async () => {
        // Admin gets all calendars, doctor gets only their own
        const response = isAdmin
            ? await calendarApi.list()
            : await calendarApi.listMine();
        setCalendars((response.data as ApiResponse<Calendar[]>).data);
    }, [isAdmin]);

    const loadAppointments = useCallback(
        async (range: ViewRange) => {
            setAppointmentsLoading(true);
            try {
                const params: Record<string, string | string[]> = {
                    from: toIsoParis(range.start),
                    to: toIsoParis(range.end),
                };

                if (!isAdmin && calendarIds.length > 0) {
                    params.calendarIds = calendarIds;
                }

                const response = await api.get<ApiResponse<Appointment[]>>('/api/appointments', { params });
                setAppointments(response.data.data);
            } finally {
                setAppointmentsLoading(false);
            }
        },
        [calendarIds, isAdmin],
    );

    const loadAvailability = useCallback(
        async (range: ViewRange) => {
            if (calendarIds.length === 0) {
                setAvailabilitySlots([]);
                return;
            }
            const params: Record<string, string | string[]> = {
                from: toIsoParis(range.start),
                to: toIsoParis(range.end),
                calendarIds,
            };
            if (appointmentTypeId && calendarIds.length === 1) {
                params.appointmentTypeId = appointmentTypeId;
            }
            const response = await getAvailabilityFeed(params);
            setAvailabilitySlots((response.data as ApiResponse<AvailabilitySlot[]>).data);
        },
        [calendarIds, appointmentTypeId],
    );

    const loadDoctors = useCallback(async () => {
        const response = await api.get<ApiResponse<Doctor[]>>('/api/doctors');
        setDoctors(response.data.data);
    }, []);

    const loadAppointmentTypes = useCallback(async (calendarId: string) => {
        setAppointmentTypesLoading(true);
        try {
            const response = await api.get<ApiResponse<AppointmentType[]>>(
                `/api/calendars/${calendarId}/appointment-types`,
            );
            const active = response.data.data.filter((type) => type.isActive);
            setAppointmentTypes(active);
            setAppointmentTypeId((current) => {
                if (current && active.some((type) => (type._id || type.id || '') === current)) {
                    return current;
                }
                return active[0]?._id || active[0]?.id || '';
            });
        } finally {
            setAppointmentTypesLoading(false);
        }
    }, []);

    const loadSamsEvents = useCallback(async (range?: ViewRange | null) => {
        const params = range
            ? {
                  from: toIsoParis(range.start),
                  to: toIsoParis(range.end),
              }
            : undefined;
        const response = await api.get<ApiResponse<SamsEvent[]>>('/api/sams/events', { params });
        setSamsEvents(response.data.data);
    }, []);

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                await Promise.all([loadCalendars(), loadDoctors()]);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, [loadCalendars, loadDoctors]);

    useEffect(() => {
        if (calendars.length === 0) return;
        setCalendarIds((current) => {
            if (current.length > 0) return current;
            return calendars
                .filter((calendar) => calendar.scope !== 'sams')
                .map((calendar) => calendar._id || calendar.id || '')
                .filter((id): id is string => Boolean(id));
        });
    }, [calendars]);

    useEffect(() => {
        if (!selectedCalendarId) {
            setAppointmentTypes([]);
            setAppointmentTypeId('');
            setAppointmentTypesLoading(false);
            return;
        }
        loadAppointmentTypes(selectedCalendarId);
    }, [selectedCalendarId, loadAppointmentTypes]);

    useEffect(() => {
        const range = viewRangeRef.current;
        if (!range) return;
        loadAppointments(range);
    }, [loadAppointments]);

    useEffect(() => {
        const range = viewRangeRef.current;
        if (!range) return;
        loadAvailability(range);
    }, [loadAvailability]);

    useEffect(() => {
        if (!includeSams) {
            setSamsEvents([]);
            return;
        }
        const range = viewRangeRef.current;
        if (!range) return;
        loadSamsEvents(range);
    }, [includeSams, loadSamsEvents]);

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

    const filteredAppointments = useMemo(() => {
        if (calendarIds.length === 0) return [];
        const selection = new Set(calendarIds);
        return appointments.filter((appointment) => selection.has(appointment.calendarId));
    }, [appointments, calendarIds]);

    const appointmentEvents = useMemo<EventInput[]>(() => {
        return filteredAppointments.map((appointment) => {
            const id = appointment._id || appointment.id || '';
            const calendar = calendarMap.get(appointment.calendarId);
            const patientName = appointment.patient
                ? `${appointment.patient.firstname ?? ''} ${appointment.patient.lastname ?? ''}`.trim()
                : 'Patient';
            const title = calendar?.label ? `${patientName} - ${calendar.label}` : patientName;
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
    }, [filteredAppointments, calendarMap]);

    const availabilityEvents = useMemo<EventInput[]>(() => {
        return availabilitySlots.map((slot) => ({
            id: `availability-${slot.startAt}-${slot.endAt}-${slot.calendarId || ''}`,
            start: slot.startAt,
            end: slot.endAt,
            display: 'background',
            backgroundColor: 'rgba(56, 189, 248, 0.50)',
            classNames: ['fc-availability-bg'],
            extendedProps: { kind: 'availability' },
        }));
    }, [availabilitySlots]);

    const samsEventItems = useMemo<EventInput[]>(() => {
        if (!includeSams) return [];
        return samsEvents.map((event) => {
            const id = event._id || event.id || '';
            const allDay = isAllDayEvent(event.startAt, event.endAt);
            return {
                id: `sams-${id}`,
                title: event.title || 'SAMS',
                start: event.startAt,
                end: event.endAt,
                allDay,
                backgroundColor: '#818CF8',
                borderColor: '#C7D2FE',
                textColor: '#0B1220',
                extendedProps: {
                    kind: 'sams',
                    description: event.description,
                    location: event.location,
                },
            };
        });
    }, [samsEvents, includeSams]);

    const events = useMemo<EventInput[]>(() => {
        return [...availabilityEvents, ...appointmentEvents, ...samsEventItems];
    }, [availabilityEvents, appointmentEvents, samsEventItems]);

    const handleDatesSet = (info: DatesSetArg) => {
        setViewTitle(info.view.title);
        setActiveView(info.view.type as CalendarView);
        const range = { start: info.start, end: info.end };
        viewRangeRef.current = range;
        setViewRange(range);
        loadAppointments(range);
        loadAvailability(range);
        if (includeSams) {
            loadSamsEvents(range);
        }
    };

    const handleEventClick = (info: EventClickArg) => {
        if (info.event.extendedProps?.kind === 'availability') {
            return;
        }
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
        if (info.event.extendedProps?.kind === 'availability') {
            info.el.style.cursor = 'default';
            const start = info.event.start ? formatDateTimeFR(info.event.start) : '';
            const end = info.event.end ? formatDateTimeFR(info.event.end) : '';
            const range = end ? `${start} - ${end}` : start;
            info.el.title = range ? `Disponibilité (${range})` : 'Disponibilité';
            return;
        }
        info.el.style.cursor = 'pointer';
        const start = info.event.start ? formatDateTimeFR(info.event.start) : '';
        const end = info.event.end ? formatDateTimeFR(info.event.end) : '';
        const range = end ? `${start} - ${end}` : start;
        info.el.title = range ? `${info.event.title} (${range})` : info.event.title;
    };

    const handleCalendarChange = (keys: Selection) => {
        if (keys === 'all') {
            const allIds = calendars
                .filter((calendar) => calendar.scope !== 'sams')
                .map((calendar) => calendar._id || calendar.id)
                .filter((id): id is string => Boolean(id));
            setCalendarIds(allIds);
            return;
        }

        setCalendarIds(Array.from(keys).map(String));
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

    const calendarCards = calendars.filter((calendar) => calendar.scope !== 'sams');
    const selectedCalendar = selectedAppointment
        ? calendarMap.get(selectedAppointment.calendarId)
        : null;
    const calendarLabel = selectedCalendar
        ? selectedCalendar.label ||
          (selectedCalendar.scope === 'doctor'
              ? 'Médical'
              : selectedCalendar.scope === 'specialty'
                ? 'Spécialité'
                : 'SAMS')
        : null;
    const doctorLabel = selectedAppointment
        ? (doctorMap.get(selectedAppointment.doctorId)?.name ||
              doctorMap.get(selectedAppointment.doctorId)?.identifier ||
              null)
        : null;

    return (
        <DashboardLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <PageHeader
                    title="Espace médecin"
                    subtitle="Consultez vos rendez-vous et générez des tokens patients."
                    actions={
                        <Button color="primary" onPress={() => setTokenModalOpen(true)}>
                            Générer un token
                        </Button>
                    }
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Calendriers</h2>
                        <Button as={Link} href="/dashboard/calendriers" variant="flat" size="sm">
                            Vue globale
                        </Button>
                    </div>
                    {loading ? (
                        <Spinner />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {calendarCards.map((calendar) => {
                                const id = calendar._id || calendar.id || '';
                                return <CalendarCard key={id} calendar={calendar} href={`/dashboard/config/${id}`} />;
                            })}
                        </div>
                    )}
                </div>

                <div className="calendar-shell p-4 mb-16">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-sams-muted">{viewTitle || 'Calendrier'}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('today')}>
                                    Aujourd'hui
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('prev')}>
                                    Préc
                                </Button>
                                <Button size="sm" variant="flat" onPress={() => handleNavigate('next')}>
                                    Suiv
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Select
                                label="Calendriers"
                                selectionMode="multiple"
                                selectedKeys={new Set(calendarIds)}
                                onSelectionChange={handleCalendarChange}
                                className="min-w-[220px]"
                            >
                                {calendarCards.map((calendar) => {
                                    const id = calendar._id || calendar.id || '';
                                    return (
                                        <SelectItem key={id}>
                                            {calendar.label ||
                                                (calendar.scope === 'doctor' ? 'Médical' : 'Spécialité')}
                                        </SelectItem>
                                    );
                                })}
                            </Select>
                            <Switch isSelected={includeSams} onValueChange={setIncludeSams} size="sm">
                                Afficher SAMS
                            </Switch>
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
                    <Card className="mt-4 border border-sams-border bg-sams-surface/70">
                        <CardBody className="relative">
                            {appointmentsLoading ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-sams-bg/70">
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
                                locale={"fr"}
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

            <GenerateTokenModal
                isOpen={tokenModalOpen}
                calendars={calendarCards}
                onClose={() => setTokenModalOpen(false)}
            />

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

export default CalendarIndex;
