import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Textarea,
} from '@heroui/react';

import type { SamsEvent } from '@/lib/types';

type SamsEventForm = {
    title: string;
    startAt: string;
    endAt: string;
    location: string;
    description: string;
};

type SamsEventModalProps = {
    isOpen: boolean;
    editing: SamsEvent | null;
    form: SamsEventForm;
    onChange: (form: SamsEventForm) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete?: () => void;
    isSaving?: boolean;
};

export const SamsEventModal = ({
    isOpen,
    editing,
    form,
    onChange,
    onClose,
    onSave,
    onDelete,
    isSaving,
}: SamsEventModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>{editing ? 'Modifier un événement' : 'Nouvel événement'}</ModalHeader>
                <ModalBody className="space-y-3">
                    <Input
                        label="Titre"
                        value={form.title}
                        onValueChange={(value) => onChange({ ...form, title: value })}
                        isRequired
                    />
                    <Input
                        label="Début"
                        type="datetime-local"
                        value={form.startAt}
                        onValueChange={(value) => onChange({ ...form, startAt: value })}
                        isRequired
                    />
                    <Input
                        label="Fin"
                        type="datetime-local"
                        value={form.endAt}
                        onValueChange={(value) => onChange({ ...form, endAt: value })}
                        isRequired
                    />
                    <Input
                        label="Localisation"
                        value={form.location}
                        onValueChange={(value) => onChange({ ...form, location: value })}
                    />
                    <Textarea
                        label="Description"
                        value={form.description}
                        onValueChange={(value) => onChange({ ...form, description: value })}
                    />
                    {editing && onDelete ? (
                        <Button color="danger" variant="flat" onPress={onDelete}>
                            Supprimer
                        </Button>
                    ) : null}
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button color="primary" onPress={onSave} isLoading={isSaving}>
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
