import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

type ConfirmDialogProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmColor?: 'primary' | 'danger' | 'secondary';
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export const ConfirmDialog = ({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirmer',
    confirmColor = 'primary',
    isLoading,
    onClose,
    onConfirm,
}: ConfirmDialogProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
            <ModalContent>
                <ModalHeader>{title}</ModalHeader>
                <ModalBody>
                    {description ? <p className="text-sm text-foreground/70">{description}</p> : null}
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button color={confirmColor} onPress={onConfirm} isLoading={isLoading}>
                        {confirmLabel}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
