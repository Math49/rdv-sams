import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

import type { AppointmentType, AvailabilitySlot, PatientInfo } from '@/lib/types';
import { formatDateTimeFR } from '@/lib/date';
import { PatientForm } from './PatientForm';

type PatientAppointmentModalProps = {
    isOpen: boolean;
    slot: AvailabilitySlot | null;
    appointmentType: AppointmentType | null;
    patient: PatientInfo;
    onChangePatient: (value: PatientInfo) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading?: boolean;
};

export const PatientAppointmentModal = ({
    isOpen,
    slot,
    appointmentType,
    patient,
    onChangePatient,
    onClose,
    onSubmit,
    loading,
}: PatientAppointmentModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>Prendre rendez-vous</ModalHeader>
                <ModalBody className="space-y-4">
                    <div className="rounded-large border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                        <p className="font-semibold text-white">{appointmentType?.label || 'Rendez-vous'}</p>
                        {slot ? (
                            <p>
                                {formatDateTimeFR(slot.startAt)} - {formatDateTimeFR(slot.endAt)}
                            </p>
                        ) : null}
                    </div>
                    <PatientForm value={patient} onChange={onChangePatient} />
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button color="primary" onPress={onSubmit} isLoading={loading} isDisabled={!slot}>
                        Valider
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
