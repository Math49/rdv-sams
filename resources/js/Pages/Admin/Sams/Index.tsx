import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Head } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';

import { SamsEventModal } from '@/Components/admin/SamsEventModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { adminApi } from '@/lib/api';
import { formatDateTimeFR, toDateTimeLocal, toIsoUtc } from '@/lib/date';
import type { ApiResponse, SamsEvent } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

const viewOptions = [
    { key: 'dayGridMonth', label: 'Mois' },
    { key: 'timeGridWeek', label: 'Semaine' },
    { key: 'timeGridDay', label: 'Jour' },
    { key: 'listWeek', label: 'Agenda' },
] as const;

const isAllDayEvent = (startAt: string, endAt?: string | null) => {
    const start = dayjs(startAt);
    if (!start.isValid()) return false;
    const end = endAt ? dayjs(endAt) : null;
    const startMidnight = start.hour() === 0 && start.minute() === 0 && start.second() === 0;
    const endMidnight = end ? end.hour() === 0 && end.minute() === 0 && end.second() === 0 : true;

    return startMidnight && endMidnight;
};

type CalendarView = (typeof viewOptions)[number]['key'];

type ViewRange = {
    start: Date;
    end: Date;
};

type FormState = {
    title: string;
    startAt: string;
    endAt: string;
    location: string;
    description: string;
};

const emptyForm: FormState = {
    title: '',
    startAt: '',
    endAt: '',
    location: '',
    description: '',
};

const SamsIndex = () => {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [events, setEvents] = useState<SamsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewTitle, setViewTitle] = useState('');
    const [activeView, setActiveView] = useState<CalendarView>('timeGridWeek');
    const [viewRange, setViewRange] = useState<ViewRange | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<SamsEvent | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SamsEvent | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { success } = useToast();

    const loadEvents = useCallback(async (range?: ViewRange | null) => {
        const params = range
            ? {
                  from: toIsoUtc(range.start),
                  to: toIsoUtc(range.end),
              }
            : undefined;
        const response = await adminApi.samsEvents(params);
        setEvents((response.data as ApiResponse<SamsEvent[]>).data);
    }, []);

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                await loadEvents();
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, [loadEvents]);

    useEffect(() => {
        if (!viewRange) return;
        loadEvents(viewRange);
    }, [loadEvents, viewRange]);

    const eventMap = useMemo(() => {
        return new Map<string, SamsEvent>(
            events
                .map((event) => [event._id || event.id || '', event] as const)
                .filter(([id]) => Boolean(id)),
        );
    }, [events]);

    const calendarEvents = useMemo<EventInput[]>(() => {
        return events.map((event) => {
            const id = event._id || event.id || '';
            const allDay = isAllDayEvent(event.startAt, event.endAt);
            return {
                id,
                title: event.title || 'SAMS',
                start: event.startAt,
                end: event.endAt,
                allDay,
                backgroundColor: '#94A3B8',
                borderColor: '#CBD5F5',
                textColor: '#0B0B0B',
            };
        });
    }, [events]);

    const handleDatesSet = (info: DatesSetArg) => {
        setViewTitle(info.view.title);
        setActiveView(info.view.type as CalendarView);
        setViewRange({ start: info.start, end: info.end });
    };

    const handleEventClick = (info: EventClickArg) => {
        const target = eventMap.get(info.event.id);
        if (!target) return;
        setEditing(target);
        setForm({
            title: target.title || '',
            startAt: toDateTimeLocal(target.startAt),
            endAt: toDateTimeLocal(target.endAt),
            location: target.location || '',
            description: target.description || '',
        });
        setModalOpen(true);
    };

    const handleEventDidMount = (info: EventMountArg) => {
        info.el.style.cursor = 'pointer';
        const start = info.event.start ? formatDateTimeFR(info.event.start) : '';
        const end = info.event.end ? formatDateTimeFR(info.event.end) : '';
        const range = end ? `${start} - ${end}` : start;
        info.el.title = range ? `${info.event.title} (${range})` : info.event.title;
    };

    const handleDateClick = (info: DateClickArg) => {
        const start = info.date;
        const end = new Date(start.getTime() + 30 * 60000);
        setEditing(null);
        setForm({
            title: '',
            startAt: toDateTimeLocal(start),
            endAt: toDateTimeLocal(end),
            location: '',
            description: '',
        });
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

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                startAt: form.startAt,
                endAt: form.endAt,
                location: form.location || undefined,
                description: form.description || undefined,
            };

            if (editing) {
                const id = editing._id || editing.id || '';
                await adminApi.updateSamsEvent(id, payload);
                success('Evenement mis a jour');
            } else {
                await adminApi.createSamsEvent(payload);
                success('Evenement cree');
            }

            closeModal();
            await loadEvents(viewRange);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (event: SamsEvent) => {
        setDeleteTarget(event);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id || deleteTarget.id || '';
        setDeleting(true);
        try {
            await adminApi.deleteSamsEvent(id);
            success('Evenement supprime');
            setDeleteOpen(false);
            await loadEvents(viewRange);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Calendrier SAMS" />
            <div className="space-y-6">
                <PageHeader
                    title="Calendrier SAMS"
                    subtitle="Gerez les evenements SAMS."
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouvel evenement
                        </Button>
                    }
                />

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
                    <Card className="mt-4 border border-neutral-800 bg-neutral-900/60">
                        <CardBody className="relative">
                            {loading ? (
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
                                events={calendarEvents}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                eventDidMount={handleEventDidMount}
                                datesSet={handleDatesSet}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <SamsEventModal
                isOpen={modalOpen}
                editing={editing}
                form={form}
                onChange={setForm}
                onClose={closeModal}
                onSave={handleSave}
                onDelete={editing ? () => confirmDelete(editing) : undefined}
                isSaving={saving}
            />

            <ConfirmDialog
                isOpen={deleteOpen}
                title="Supprimer l evenement"
                description="Confirmez la suppression de l evenement selectionne."
                confirmLabel="Supprimer"
                confirmColor="danger"
                isLoading={deleting}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />
        </AdminLayout>
    );
};

export default SamsIndex;
