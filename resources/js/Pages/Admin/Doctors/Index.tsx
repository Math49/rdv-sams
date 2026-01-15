import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Head } from '@inertiajs/react';
import {
    Button,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';

import { AccountModal } from '@/Components/admin/AccountModal';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { adminApi } from '@/lib/api';
import type { ApiError, ApiResponse, Specialty, User } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

type SpecialtyOption = {
    id: string;
    label: string;
};

type FormState = {
    identifier: string;
    firstName: string;
    lastName: string;
    password: string;
    roles: string[];
    specialtyIds: string[];
    isActive: boolean;
};

const emptyForm: FormState = {
    identifier: '',
    firstName: '',
    lastName: '',
    password: '',
    roles: ['doctor'],
    specialtyIds: [],
    isActive: true,
};

const splitName = (name?: string | null): { firstName: string; lastName: string } => {
    if (!name) return { firstName: '', lastName: '' };
    const parts = name.trim().split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const buildName = (firstName: string, lastName: string): string | undefined => {
    const name = `${firstName} ${lastName}`.trim();
    return name.length > 0 ? name : undefined;
};

const resolveSpecialtyId = (value: unknown): string | null => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const candidate = value as { _id?: string; id?: string };
        return candidate._id || candidate.id || null;
    }
    return null;
};

const normalizeSpecialtyIds = (values?: unknown[]): string[] => {
    if (!values) return [];
    return values
        .map((value) => resolveSpecialtyId(value))
        .filter((id): id is string => Boolean(id));
};

const DoctorsIndex = () => {
    const [doctors, setDoctors] = useState<User[]>([]);
    const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { success } = useToast();

    const specialtyMap = useMemo(() => {
        const map = new Map<string, string>();
        specialties.forEach((specialty) => map.set(specialty.id, specialty.label));
        return map;
    }, [specialties]);

    const loadDoctors = async () => {
        const response = await adminApi.listDoctors();
        setDoctors((response.data as ApiResponse<User[]>).data);
    };

    const loadSpecialties = async () => {
        const response = await adminApi.specialties();
        const items = ((response.data as ApiResponse<Specialty[]>).data || [])
            .map((specialty) => ({
                id: specialty._id || specialty.id || '',
                label: specialty.label,
            }))
            .filter((item) => item.id.length > 0)
            .sort((a, b) => a.label.localeCompare(b.label));
        setSpecialties(items);
    };

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                await Promise.all([loadDoctors(), loadSpecialties()]);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormErrors({});
        setModalOpen(true);
    };

    const openEdit = (doctor: User) => {
        const parts = splitName(doctor.name || '');
        setEditing(doctor);
        setForm({
            identifier: doctor.identifier,
            firstName: parts.firstName,
            lastName: parts.lastName,
            password: '',
            roles: doctor.roles || ['doctor'],
            specialtyIds: normalizeSpecialtyIds(doctor.specialtyIds as unknown[]),
            isActive: Boolean(doctor.isActive),
        });
        setFormErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
        setFormErrors({});
    };

    const handleSave = async () => {
        setSaving(true);
        setFormErrors({});
        try {
            const payload = {
                identifier: form.identifier,
                name: buildName(form.firstName, form.lastName),
                roles: form.roles,
                specialtyIds: form.specialtyIds,
                isActive: form.isActive,
            };

            if (editing) {
                const id = editing._id || editing.id || '';
                await adminApi.updateDoctor(id, payload);
                if (form.password) {
                    await adminApi.resetDoctorPassword(id, { password: form.password });
                }
                success('Compte mis a jour');
            } else {
                await adminApi.createDoctor({ ...payload, password: form.password });
                success('Compte cree');
            }

            closeModal();
            await loadDoctors();
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
                setFormErrors(axiosError.response.data.errors);
                return;
            }
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (doctor: User) => {
        setDeleteTarget(doctor);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id || deleteTarget.id || '';
        setDeleting(true);
        try {
            await adminApi.deleteDoctor(id);
            success('Compte supprime');
            setDeleteOpen(false);
            await loadDoctors();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Comptes" />
            <div className="space-y-6">
                <PageHeader
                    title="Comptes medecins"
                    subtitle="Gerez les comptes des soignants."
                    actions={
                        <Button color="primary" onPress={openCreate}>
                            Nouveau compte
                        </Button>
                    }
                />

                {loading ? (
                    <Spinner />
                ) : (
                    <Table aria-label="Comptes medecins">
                        <TableHeader>
                            <TableColumn>Medecin</TableColumn>
                            <TableColumn>Specialites</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="Aucun compte">
                            {doctors.map((doctor) => {
                                const id = doctor._id || doctor.id || '';
                                const name = doctor.name || doctor.identifier;
                                const labels = normalizeSpecialtyIds(doctor.specialtyIds as unknown[])
                                    .map((specialtyId) => specialtyMap.get(specialtyId) || specialtyId)
                                    .filter(Boolean);
                                return (
                                    <TableRow key={id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-semibold">{name}</p>
                                                <p className="text-xs text-foreground/60">{doctor.identifier}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-foreground/70">
                                                {labels.length > 0 ? labels.join(', ') : 'Aucune'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="flat" onPress={() => openEdit(doctor)}>
                                                    Modifier
                                                </Button>
                                                <Button size="sm" color="danger" variant="flat" onPress={() => confirmDelete(doctor)}>
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

            <AccountModal
                isOpen={modalOpen}
                editing={editing}
                form={form}
                specialties={specialties}
                errors={formErrors}
                onChange={setForm}
                onClose={closeModal}
                onSave={handleSave}
                isSaving={saving}
            />

            <ConfirmDialog
                isOpen={deleteOpen}
                title="Supprimer le compte"
                description="Confirmez la suppression du compte selectionne."
                confirmLabel="Supprimer"
                confirmColor="danger"
                isLoading={deleting}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />
        </AdminLayout>
    );
};

export default DoctorsIndex;
