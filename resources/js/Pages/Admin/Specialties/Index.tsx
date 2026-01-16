import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button,
    Spinner,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';

import { SpecialtyModal } from '@/Components/admin/SpecialtyModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { adminApi } from '@/lib/api';
import type { ApiResponse, Specialty } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type SpecialtyForm = {
    label: string;
    color: string;
    isActive: boolean;
};

const emptyForm: SpecialtyForm = {
    label: '',
    color: '#3B82F6',
    isActive: true,
};

const SpecialtiesIndex = () => {
    const [loading, setLoading] = useState(true);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Specialty | null>(null);
    const [form, setForm] = useState<SpecialtyForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { success } = useToast();

    const loadSpecialties = async () => {
        setLoading(true);
        try {
            const response = await adminApi.specialties();
            const data = (response.data as ApiResponse<Specialty[]>).data || [];
            setSpecialties(data.slice().sort((a, b) => a.label.localeCompare(b.label)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSpecialties();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (specialty: Specialty) => {
        setEditing(specialty);
        setForm({
            label: specialty.label,
            color: specialty.color || '#3B82F6',
            isActive: specialty.isActive ?? true,
        });
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
            if (editing) {
                const id = editing._id || editing.id || '';
                await adminApi.updateSpecialty(id, {
                    label: form.label,
                    color: form.color,
                    isActive: form.isActive,
                });
                success('Specialité mise à jour');
            } else {
                await adminApi.createSpecialty({
                    label: form.label,
                    color: form.color,
                    isActive: form.isActive,
                });
                success('Specialité créée');
            }
            closeModal();
            await loadSpecialties();
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (specialty: Specialty) => {
        setDeleteTarget(specialty);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id || deleteTarget.id || '';
        setDeleting(true);
        try {
            await adminApi.deleteSpecialty(id);
            success('Specialité supprimée');
            setDeleteOpen(false);
            await loadSpecialties();
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (specialty: Specialty, value: boolean) => {
        const id = specialty._id || specialty.id || '';
        if (!id) return;
        await adminApi.updateSpecialty(id, { isActive: value });
        setSpecialties((current) =>
            current.map((item) => {
                const itemId = item._id || item.id || '';
                return itemId === id ? { ...item, isActive: value } : item;
            }),
        );
    };

    return (
        <AdminLayout>
            <Head title="Spécialités" />
            <div className="space-y-6">
                <PageHeader
                    title="Spécialités"
                    subtitle="Gérez la liste des spécialités."
                    backHref="/dashboard/admin"
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouvelle spécialité
                        </Button>
                    }
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <Table aria-label="Spécialités">
                        <TableHeader>
                            <TableColumn>Spécialité</TableColumn>
                            <TableColumn>Activé</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="Aucune spécialité">
                            {specialties.map((specialty) => {
                                const id = specialty._id || specialty.id || '';
                                return (
                                    <TableRow key={id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {specialty.color ? (
                                                    <span
                                                        className="h-3 w-3 rounded-full"
                                                        style={{ backgroundColor: specialty.color }}
                                                    />
                                                ) : null}
                                                <span className="font-semibold">{specialty.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                isSelected={specialty.isActive ?? true}
                                                onValueChange={(value) => handleToggleActive(specialty, value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="flat" onPress={() => openEdit(specialty)}>
                                                    Modifier
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    onPress={() => confirmDelete(specialty)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            <SpecialtyModal
                isOpen={modalOpen}
                editing={editing}
                form={form}
                onChange={setForm}
                onClose={closeModal}
                onSave={handleSave}
                isSaving={saving}
            />

            <ConfirmDialog
                isOpen={deleteOpen}
                title="Supprimer la spécialité"
                description="Confirmez la suppression de la spécialité sélectionnée."
                confirmLabel="Supprimer"
                confirmColor="danger"
                isLoading={deleting}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />
        </AdminLayout>
    );
};

export default SpecialtiesIndex;
