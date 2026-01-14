import { FormEvent, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input, Spinner, Textarea } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { ApiResponse, SamsEvent } from '@/lib/types';
import { toDateTimeLocal } from '@/lib/date';
import { useToast } from '@/hooks/useToast';

type SamsEditProps = {
    id: string;
};

const SamsEdit = ({ id }: SamsEditProps) => {
    const [event, setEvent] = useState<SamsEvent | null>(null);
    const [title, setTitle] = useState('');
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { success } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.get<ApiResponse<SamsEvent[]>>('/api/admin/sams/events');
                const found = response.data.data.find((item) => (item._id || item.id) === id) || null;
                setEvent(found);
                setTitle(found?.title || '');
                setStartAt(toDateTimeLocal(found?.startAt || ''));
                setEndAt(toDateTimeLocal(found?.endAt || ''));
                setLocation(found?.location || '');
                setDescription(found?.description || '');
                setSource(found?.source || '');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleSubmit = async (submitEvent: FormEvent) => {
        submitEvent.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/api/admin/sams/events/${id}`, {
                title,
                startAt,
                endAt,
                location: location || undefined,
                description: description || undefined,
                source: source || undefined,
            });
            success('Evenement mis a jour');
            router.visit('/dashboard/admin/sams');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/api/admin/sams/events/${id}`);
        success('Evenement supprime');
        router.visit('/dashboard/admin/sams');
    };

    if (loading) {
        return (
            <AdminLayout>
                <Spinner />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Modifier un evenement" />
            <div className="space-y-6">
                <PageHeader title="Modifier un evenement SAMS" subtitle={event?.title || ''} />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Titre" value={title} onValueChange={setTitle} isRequired />
                    <Input label="Debut" type="datetime-local" value={startAt} onValueChange={setStartAt} isRequired />
                    <Input label="Fin" type="datetime-local" value={endAt} onValueChange={setEndAt} isRequired />
                    <Input label="Lieu" value={location} onValueChange={setLocation} />
                    <Textarea label="Description" value={description} onValueChange={setDescription} />
                    <Input label="Source" value={source} onValueChange={setSource} />
                    <div className="flex flex-wrap gap-2">
                        <Button color="primary" type="submit" isLoading={saving}>
                            Enregistrer
                        </Button>
                        <Button color="danger" variant="flat" onPress={handleDelete}>
                            Supprimer
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default SamsEdit;
