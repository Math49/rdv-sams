import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button, Card, CardBody, Spinner } from '@heroui/react';

import { CalendarFilters, CalendarFilterState } from '@/Components/dashboard/CalendarFilters';
import { GenerateTokenModal } from '@/Components/dashboard/GenerateTokenModal';
import { TransferModal } from '@/Components/dashboard/TransferModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageHeader } from '@/Components/ui/PageHeader';
import { StatusPill } from '@/Components/ui/StatusPill';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api } from '@/lib/api';
import { formatDate, formatDateTime, startOfDayUtc, endOfDayUtc } from '@/lib/date';
import type { ApiResponse, Appointment, Calendar, Doctor } from '@/lib/types';
import { EventDrawer } from './EventDrawer';

const CalendarIndex = () => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<CalendarFilterState>(() => {
        const today = formatDate(new Date());
        return {
            from: today,
            to: today,
            calendarIds: [],
        };
    });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [tokenModalOpen, setTokenModalOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const loadCalendars = useCallback(async () => {
        const response = await api.get<ApiResponse<Calendar[]>>('/api/calendars');
        setCalendars(response.data.data);
    }, []);

    const loadAppointments = useCallback(async () => {
        const params: Record<string, string | string[]> = {};
        if (filters.from) params.from = startOfDayUtc(filters.from);
        if (filters.to) params.to = endOfDayUtc(filters.to);
        if (filters.calendarIds.length > 0) params.calendarIds = filters.calendarIds;

        const response = await api.get<ApiResponse<Appointment[]>>('/api/appointments', { params });
        setAppointments(response.data.data);
    }, [filters]);

    const loadDoctors = useCallback(async () => {
        const response = await api.get<ApiResponse<Doctor[]>>('/api/doctors');
        setDoctors(response.data.data);
    }, []);

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                await Promise.all([loadCalendars(), loadAppointments(), loadDoctors()]);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, [loadCalendars, loadAppointments, loadDoctors]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const calendarMap = useMemo(() => {
        return new Map(
            calendars.map((calendar) => [calendar._id || calendar.id || '', calendar.label || calendar.scope]),
        );
    }, [calendars]);

    const handleSelectAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDrawerOpen(true);
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointment?._id && !selectedAppointment?.id) return;
        setCancelLoading(true);
        try {
            const id = selectedAppointment._id || selectedAppointment.id || '';
            await api.post(`/api/appointments/${id}/cancel`, {});
            setCancelOpen(false);
            await loadAppointments();
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Calendrier" />
            <div className="space-y-6">
                <PageHeader
                    title="Calendrier"
                    subtitle="Consultez vos rendez-vous et generez des tokens patients."
                    actions={
                        <Button color="primary" onPress={() => setTokenModalOpen(true)}>
                            Generer un token
                        </Button>
                    }
                />

                <CalendarFilters calendars={calendars} value={filters} onChange={setFilters} />

                <Card className="border border-white/10 bg-white/5">
                    <CardBody className="space-y-4">
                        <h3 className="text-lg font-semibold">Rendez-vous</h3>
                        {loading ? (
                            <Spinner />
                        ) : appointments.length === 0 ? (
                            <EmptyState title="Aucun rendez-vous" description="Aucun RDV ne correspond aux filtres." />
                        ) : (
                            <div className="space-y-2">
                                {appointments.map((appointment) => {
                                    const calendarLabel =
                                        calendarMap.get(appointment.calendarId) || appointment.calendarId;
                                    return (
                                        <button
                                            key={appointment._id || appointment.id}
                                            onClick={() => handleSelectAppointment(appointment)}
                                            className="flex w-full items-center justify-between rounded-large border border-white/10 bg-black/30 px-4 py-3 text-left transition hover:border-white/20"
                                        >
                                            <div>
                                                <p className="text-sm text-foreground/70">{calendarLabel}</p>
                                                <p className="text-base font-semibold">
                                                    {appointment.patient?.lastname || 'Patient'} -{' '}
                                                    {formatDateTime(appointment.startAt)}
                                                </p>
                                            </div>
                                            <StatusPill value={appointment.status} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <GenerateTokenModal
                isOpen={tokenModalOpen}
                calendars={calendars.filter((calendar) => calendar.scope !== 'sams')}
                onClose={() => setTokenModalOpen(false)}
            />

            <EventDrawer
                isOpen={drawerOpen}
                appointment={selectedAppointment}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedAppointment(null);
                }}
                onTransfer={() => setTransferOpen(true)}
                onCancel={() => setCancelOpen(true)}
            />

            <TransferModal
                isOpen={transferOpen}
                appointmentId={selectedAppointment?._id || selectedAppointment?.id || null}
                doctors={doctors}
                onClose={() => setTransferOpen(false)}
                onTransferred={loadAppointments}
            />

            <ConfirmDialog
                isOpen={cancelOpen}
                title="Annuler le rendez-vous"
                description="Confirmez l'annulation du rendez-vous selectionne."
                confirmLabel="Annuler"
                confirmColor="danger"
                isLoading={cancelLoading}
                onClose={() => setCancelOpen(false)}
                onConfirm={handleCancelAppointment}
            />
        </DashboardLayout>
    );
};

export default CalendarIndex;
