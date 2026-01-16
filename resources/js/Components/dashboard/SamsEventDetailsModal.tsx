import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

import { SectionCard } from '@/Components/ui/SectionCard';
import { formatDateTimeFR } from '@/lib/date';
import type { SamsEvent } from '@/lib/types';

type SamsEventDetailsModalProps = {
    isOpen: boolean;
    event: SamsEvent | null;
    onClose: () => void;
};

export const SamsEventDetailsModal = ({ isOpen, event, onClose }: SamsEventDetailsModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>Détails événement SAMS</ModalHeader>
                <ModalBody className="space-y-4">
                    {!event ? (
                        <p className="text-sm text-sams-muted">Aucun événement sélectionné.</p>
                    ) : (
                        <>
                            <SectionCard title="Événement">
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold">{event.title || 'SAMS'}</p>
                                    <p className="text-sams-muted">
                                        {formatDateTimeFR(event.startAt)} - {formatDateTimeFR(event.endAt)}
                                    </p>
                                </div>
                            </SectionCard>
                            <SectionCard title="Localisation">
                                <p className="text-sm text-sams-text/80">{event.location || 'Non renseignée'}</p>
                            </SectionCard>
                            <SectionCard title="Description">
                                <p className="text-sm text-sams-text/80">{event.description || 'Aucune description'}</p>
                            </SectionCard>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Fermer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
