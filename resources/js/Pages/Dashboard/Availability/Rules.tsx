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
import type { ApiResponse, AvailabilityRule } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type RulesProps = {
    calendarId: string;
};

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const Rules = ({ calendarId }: RulesProps) => {
    const [rules, setRules] = useState<AvailabilityRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AvailabilityRule | null>(null);
    const [form, setForm] = useState({
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '17:00',
        slotMinutes: '30',
        validFrom: '',
        validTo: '',
        timezone: '',
    });
    const { success } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const response = await api.get<ApiResponse<AvailabilityRule[]>>(
                `/api/calendars/${calendarId}/availability-rules`,
            );
            setRules(response.data.data);
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
            dayOfWeek: '1',
            startTime: '09:00',
            endTime: '17:00',
            slotMinutes: '30',
            validFrom: '',
            validTo: '',
            timezone: '',
        });
        setModalOpen(true);
    };

    const openEdit = (rule: AvailabilityRule) => {
        setEditing(rule);
        setForm({
            dayOfWeek: String(rule.dayOfWeek),
            startTime: rule.startTime,
            endTime: rule.endTime,
            slotMinutes: String(rule.slotMinutes),
            validFrom: rule.validFrom || '',
            validTo: rule.validTo || '',
            timezone: rule.timezone || '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload = {
            dayOfWeek: Number(form.dayOfWeek),
            startTime: form.startTime,
            endTime: form.endTime,
            slotMinutes: Number(form.slotMinutes),
            validFrom: form.validFrom || null,
            validTo: form.validTo || null,
            timezone: form.timezone || null,
        };

        if (editing) {
            await api.patch(`/api/availability-rules/${editing._id || editing.id}`, payload);
            success('Regle mise a jour');
        } else {
            await api.post(`/api/calendars/${calendarId}/availability-rules`, payload);
            success('Regle creee');
        }

        setModalOpen(false);
        await load();
    };

    const handleDelete = async (rule: AvailabilityRule) => {
        await api.delete(`/api/availability-rules/${rule._id || rule.id}`);
        success('Regle supprimee');
        await load();
    };

    return (
        <DashboardLayout>
            <Head title="Regles disponibilite" />
            <div className="space-y-6">
                <PageHeader
                    title="Regles de disponibilite"
                    subtitle="Definissez les creneaux reguliers de vos calendriers."
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouvelle regle
                        </Button>
                    }
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <SectionCard title="Regles">
                        <div className="space-y-3">
                            {rules.map((rule) => (
                                <div
                                    key={rule._id || rule.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-large border border-white/10 bg-black/30 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {dayLabels[rule.dayOfWeek]} {rule.startTime} - {rule.endTime}
                                        </p>
                                        <p className="text-xs text-foreground/60">
                                            Slot {rule.slotMinutes} min
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="flat" onPress={() => openEdit(rule)}>
                                            Editer
                                        </Button>
                                        <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(rule)}>
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
                    <ModalHeader>{editing ? 'Modifier la regle' : 'Nouvelle regle'}</ModalHeader>
                    <ModalBody className="space-y-3">
                        <Select
                            label="Jour"
                            selectedKeys={new Set([form.dayOfWeek])}
                            onSelectionChange={(keys) => {
                                if (keys === 'all') {
                                    setForm({ ...form, dayOfWeek: '0' });
                                    return;
                                }
                                const first = Array.from(keys)[0];
                                setForm({ ...form, dayOfWeek: String(first) });
                            }}
                        >
                            {dayLabels.map((label, index) => (
                                <SelectItem key={String(index)} value={String(index)}>
                                    {label}
                                </SelectItem>
                            ))}
                        </Select>
                        <Input label="Debut" type="time" value={form.startTime} onValueChange={(value) => setForm({ ...form, startTime: value })} />
                        <Input label="Fin" type="time" value={form.endTime} onValueChange={(value) => setForm({ ...form, endTime: value })} />
                        <Input
                            label="Duree slot (min)"
                            type="number"
                            value={form.slotMinutes}
                            onValueChange={(value) => setForm({ ...form, slotMinutes: value })}
                        />
                        <Input
                            label="Valide du"
                            type="date"
                            value={form.validFrom}
                            onValueChange={(value) => setForm({ ...form, validFrom: value })}
                        />
                        <Input
                            label="Valide au"
                            type="date"
                            value={form.validTo}
                            onValueChange={(value) => setForm({ ...form, validTo: value })}
                        />
                        <Input
                            label="Timezone"
                            value={form.timezone}
                            onValueChange={(value) => setForm({ ...form, timezone: value })}
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

export default Rules;
