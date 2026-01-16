import { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Input, Textarea } from '@heroui/react';

import { PageHeader } from '@/Components/ui/PageHeader';
import { AdminLayout } from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const SamsCreate = () => {
    const [title, setTitle] = useState('');
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('');
    const [loading, setLoading] = useState(false);
    const { success } = useToast();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/admin/sams/events', {
                title,
                startAt,
                endAt,
                location: location || undefined,
                description: description || undefined,
                source: source || undefined,
            });
            success('Événement créé');
            router.visit('/dashboard/admin/calendrier-sams');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Créer un événement" />
            <div className="space-y-6">
                <PageHeader title="Créer un événement SAMS" backHref="/dashboard/admin/calendrier-sams" />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Titre" value={title} onValueChange={setTitle} isRequired />
                    <Input label="Début" type="datetime-local" value={startAt} onValueChange={setStartAt} isRequired />
                    <Input label="Fin" type="datetime-local" value={endAt} onValueChange={setEndAt} isRequired />
                    <Input label="Lieu" value={location} onValueChange={setLocation} />
                    <Textarea label="Description" value={description} onValueChange={setDescription} />
                    <Input label="Source" value={source} onValueChange={setSource} />
                    <Button color="primary" type="submit" isLoading={loading}>
                        Créer
                    </Button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default SamsCreate;
