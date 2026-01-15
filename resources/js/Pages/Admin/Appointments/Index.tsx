import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button, Input, Select, SelectItem, Spinner } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { SectionCard } from '@/Components/ui/SectionCard';
import { StatusPill } from '@/Components/ui/StatusPill';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import { formatDate, formatDateTimeFR } from '@/lib/date';
import type { ApiResponse, Appointment, Doctor } from '@/lib/types';

const AdminAppointmentsIndex = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: formatDate(new Date()),
        to: formatDate(new Date()),
        doctorId: '',
    });

    const load = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            if (filters.doctorId) params.doctorId = filters.doctorId;

            const [appointmentsRes, doctorsRes] = await Promise.all([
                api.get<ApiResponse<Appointment[]>>('/api/admin/appointments', { params }),
                api.get<ApiResponse<Doctor[]>>('/api/doctors'),
            ]);
            setAppointments(appointmentsRes.data.data);
            setDoctors(doctorsRes.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <AdminLayout>
            <Head title="Rendez-vous" />
            <div className="space-y-6">
                <PageHeader title="Rendez-vous" subtitle="Vue globale des RDV." />

                <SectionCard title="Filtres">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            type="date"
                            label="Du"
                            value={filters.from}
                            onValueChange={(from) => setFilters({ ...filters, from })}
                        />
                        <Input
                            type="date"
                            label="Au"
                            value={filters.to}
                            onValueChange={(to) => setFilters({ ...filters, to })}
                        />
                        <Select
                            label="Medecin"
                            selectedKeys={filters.doctorId ? new Set([filters.doctorId]) : new Set()}
                            onSelectionChange={(keys) => {
                                if (keys === 'all') {
                                    setFilters({ ...filters, doctorId: '' });
                                    return;
                                }
                                const first = Array.from(keys)[0];
                                setFilters({ ...filters, doctorId: first ? String(first) : '' });
                            }}
                        >
                            {doctors.map((doctor) => {
                                const id = doctor._id || doctor.id || '';
                                return (
                                    <SelectItem key={id}>
                                        {doctor.name || doctor.identifier}
                                    </SelectItem>
                                );
                            })}
                        </Select>
                    </div>
                    <Button className="mt-3" onPress={load}>
                        Appliquer
                    </Button>
                </SectionCard>

                {loading ? (
                    <Spinner />
                ) : (
                    <SectionCard title="Rendez-vous">
                        <div className="space-y-2">
                            {appointments.map((appointment) => (
                                <div
                                    key={appointment._id || appointment.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-large border border-white/10 bg-black/30 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {appointment.patient?.lastname || 'Patient'} -{' '}
                                            {formatDateTimeFR(appointment.startAt)}
                                        </p>
                                        <p className="text-xs text-foreground/60">{appointment.doctorId}</p>
                                    </div>
                                    <StatusPill value={appointment.status} />
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAppointmentsIndex;
