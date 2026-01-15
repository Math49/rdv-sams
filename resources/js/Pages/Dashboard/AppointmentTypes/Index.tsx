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
    Spinner,
    Switch,
} from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { SectionCard } from '@/Components/ui/SectionCard';
import { DashboardLayout } from '@/Layouts/DashboardLayout';
import { api } from '@/lib/api';
import type { ApiResponse, AppointmentType } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type AppointmentTypesProps = {
    calendarId: string;
};

const AppointmentTypesIndex = ({ calendarId }: AppointmentTypesProps) => {
    const [items, setItems] = useState<AppointmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AppointmentType | null>(null);
    const [form, setForm] = useState({
        label: '',
        durationMinutes: '30',
        bufferBeforeMinutes: '0',
        bufferAfterMinutes: '0',
        isActive: true,
    });
    const { success } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const response = await api.get<ApiResponse<AppointmentType[]>>(
                `/api/calendars/${calendarId}/appointment-types`,
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
            label: '',
            durationMinutes: '30',
            bufferBeforeMinutes: '0',
            bufferAfterMinutes: '0',
            isActive: true,
        });
        setModalOpen(true);
    };

    const openEdit = (item: AppointmentType) => {
        setEditing(item);
        setForm({
            label: item.label,
            durationMinutes: String(item.durationMinutes),
            bufferBeforeMinutes: String(item.bufferBeforeMinutes ?? 0),
            bufferAfterMinutes: String(item.bufferAfterMinutes ?? 0),
            isActive: item.isActive,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload = {
            label: form.label,
            durationMinutes: Number(form.durationMinutes),
            bufferBeforeMinutes: Number(form.bufferBeforeMinutes),
            bufferAfterMinutes: Number(form.bufferAfterMinutes),
            isActive: form.isActive,
        };

        if (editing) {
            await api.patch(`/api/appointment-types/${editing._id || editing.id}`, payload);
            success('Type mis a jour');
        } else {
            await api.post(`/api/calendars/${calendarId}/appointment-types`, payload);
            success('Type cree');
        }

        setModalOpen(false);
        await load();
    };

    const handleDelete = async (item: AppointmentType) => {
        await api.delete(`/api/appointment-types/${item._id || item.id}`);
        success('Type supprime');
        await load();
    };

    return (
        <DashboardLayout>
            <Head title="Types de rendez-vous" />
            <div className="space-y-6">
                <PageHeader
                    title="Types de rendez-vous"
                    subtitle="Definissez les types de rendez-vous disponibles."
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouveau type
                        </Button>
                    }
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <SectionCard title="Types">
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item._id || item.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-large border border-white/10 bg-black/30 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{item.label}</p>
                                        <p className="text-xs text-foreground/60">{item.durationMinutes} min</p>
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
                    <ModalHeader>{editing ? 'Modifier le type' : 'Nouveau type'}</ModalHeader>
                    <ModalBody className="space-y-3">
                        <Input label="Libelle" value={form.label} onValueChange={(value) => setForm({ ...form, label: value })} />
                        <Input
                            label="Duree (min)"
                            type="number"
                            value={form.durationMinutes}
                            onValueChange={(value) => setForm({ ...form, durationMinutes: value })}
                        />
                        <Input
                            label="Buffer avant (min)"
                            type="number"
                            value={form.bufferBeforeMinutes}
                            onValueChange={(value) => setForm({ ...form, bufferBeforeMinutes: value })}
                        />
                        <Input
                            label="Buffer apres (min)"
                            type="number"
                            value={form.bufferAfterMinutes}
                            onValueChange={(value) => setForm({ ...form, bufferAfterMinutes: value })}
                        />
                        <Switch isSelected={form.isActive} onValueChange={(value) => setForm({ ...form, isActive: value })}>
                            Actif
                        </Switch>
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

export default AppointmentTypesIndex;
