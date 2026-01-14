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
            success('Evenement cree');
            router.visit('/dashboard/admin/sams');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Creer un evenement" />
            <div className="space-y-6">
                <PageHeader title="Creer un evenement SAMS" />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Titre" value={title} onValueChange={setTitle} isRequired />
                    <Input label="Debut" type="datetime-local" value={startAt} onValueChange={setStartAt} isRequired />
                    <Input label="Fin" type="datetime-local" value={endAt} onValueChange={setEndAt} isRequired />
                    <Input label="Lieu" value={location} onValueChange={setLocation} />
                    <Textarea label="Description" value={description} onValueChange={setDescription} />
                    <Input label="Source" value={source} onValueChange={setSource} />
                    <Button color="primary" type="submit" isLoading={loading}>
                        Creer
                    </Button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default SamsCreate;
