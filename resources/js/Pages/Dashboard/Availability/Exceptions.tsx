import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Spinner,
} from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { SectionCard } from '@/Components/ui/SectionCard';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api } from '@/lib/api';
import type { ApiResponse, AvailabilityException } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type ExceptionsProps = {
    calendarId: string;
};

const Exceptions = ({ calendarId }: ExceptionsProps) => {
    const [items, setItems] = useState<AvailabilityException[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AvailabilityException | null>(null);
    const [form, setForm] = useState({
        date: '',
        kind: 'remove',
        startTime: '09:00',
        endTime: '17:00',
        reason: '',
    });
    const { success } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const response = await api.get<ApiResponse<AvailabilityException[]>>(
                `/api/calendars/${calendarId}/availability-exceptions`,
            );
            setItems(response.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [calendarId]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            date: '',
            kind: 'remove',
            startTime: '09:00',
            endTime: '17:00',
            reason: '',
        });
        setModalOpen(true);
    };

    const openEdit = (item: AvailabilityException) => {
        setEditing(item);
        setForm({
            date: item.date,
            kind: item.kind,
            startTime: item.startTime,
            endTime: item.endTime,
            reason: item.reason || '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload = {
            date: form.date,
            kind: form.kind,
            startTime: form.startTime,
            endTime: form.endTime,
            reason: form.reason || null,
        };

        if (editing) {
            await api.patch(`/api/availability-exceptions/${editing._id || editing.id}`, payload);
            success('Exception mise à jour');
        } else {
            await api.post(`/api/calendars/${calendarId}/availability-exceptions`, payload);
            success('Exception créée');
        }

        setModalOpen(false);
        await load();
    };

    const handleDelete = async (item: AvailabilityException) => {
        await api.delete(`/api/availability-exceptions/${item._id || item.id}`);
        success('Exception supprimée');
        await load();
    };

    return (
        <DashboardLayout>
            <Head title="Exceptions disponibilité" />
            <div className="space-y-6">
                <PageHeader
                    title="Exceptions de disponibilité"
                    subtitle="Ajoutez des indisponibilités ou des créneaux ponctuels."
                    backHref={`/dashboard/config/${calendarId}`}
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouvelle exception
                        </Button>
                    }
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <SectionCard title="Exceptions">
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item._id || item.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-large border border-sams-border bg-sams-surface/70 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {item.date} {item.startTime} - {item.endTime}
                                        </p>
                                        <p className="text-xs text-sams-muted">{item.kind}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="flat" onPress={() => openEdit(item)}>
                                            Editer
                                        </Button>
                                        <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(item)}>
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} backdrop="blur">
                <ModalContent>
                    <ModalHeader>{editing ? `Modifier l'exception` : 'Nouvelle exception'}</ModalHeader>
                    <ModalBody className="space-y-3">
                        <Input
                            label="Date"
                            type="date"
                            value={form.date}
                            onValueChange={(value) => setForm({ ...form, date: value })}
                        />
                        <Select
                            label="Type"
                            selectedKeys={new Set([form.kind])}
                            onSelectionChange={(keys) => {
                                const first = Array.from(keys)[0];
                                setForm({ ...form, kind: String(first) });
                            }}
                        >
                            <SelectItem key="remove">
                                Indisponible
                            </SelectItem>
                            <SelectItem key="add">
                                Créneau ajouté
                            </SelectItem>
                        </Select>
                        <Input
                            label="Début"
                            type="time"
                            value={form.startTime}
                            onValueChange={(value) => setForm({ ...form, startTime: value })}
                        />
                        <Input
                            label="Fin"
                            type="time"
                            value={form.endTime}
                            onValueChange={(value) => setForm({ ...form, endTime: value })}
                        />
                        <Input
                            label="Raison"
                            value={form.reason}
                            onValueChange={(value) => setForm({ ...form, reason: value })}
                        />
                    </ModalBody>
                    <ModalFooter className="gap-2">
                        <Button variant="light" onPress={() => setModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button color="primary" onPress={handleSave}>
                            Enregistrer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default Exceptions;
