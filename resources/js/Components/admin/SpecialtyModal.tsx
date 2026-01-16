import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Switch,
} from '@heroui/react';

import type { Specialty } from '@/lib/types';

type SpecialtyForm = {
    label: string;
    color: string;
    isActive: boolean;
};

type SpecialtyModalProps = {
    isOpen: boolean;
    editing: Specialty | null;
    form: SpecialtyForm;
    onChange: (form: SpecialtyForm) => void;
    onClose: () => void;
    onSave: () => void;
    isSaving?: boolean;
};

export const SpecialtyModal = ({
    isOpen,
    editing,
    form,
    onChange,
    onClose,
    onSave,
    isSaving,
}: SpecialtyModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>{editing ? 'Modifier une spécialité' : 'Nouvelle spécialité'}</ModalHeader>
                <ModalBody className="space-y-3">
                    <Input
                        label="Nom de la spécialité"
                        value={form.label}
                        onValueChange={(value) => onChange({ ...form, label: value })}
                        isRequired
                    />
                    <Input
                        label="Couleur"
                        type="color"
                        value={form.color}
                        onValueChange={(value) => onChange({ ...form, color: value })}
                    />
                    <Switch
                        isSelected={form.isActive}
                        onValueChange={(value) => onChange({ ...form, isActive: value })}
                    >
                        Actif
                    </Switch>
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
