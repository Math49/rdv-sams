import { useState } from 'react';
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
} from '@heroui/react';

import { api } from '@/lib/api';
import type { ApiResponse, Doctor } from '@/lib/types';
import { toast } from '@/hooks/useToast';

type TransferModalProps = {
    isOpen: boolean;
    appointmentId: string | null;
    doctors: Doctor[];
    onClose: () => void;
    onTransferred?: () => void;
};

export const TransferModal = ({ isOpen, appointmentId, doctors, onClose, onTransferred }: TransferModalProps) => {
    const [toDoctorId, setToDoctorId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async () => {
        if (!appointmentId || !toDoctorId) return;
        setLoading(true);
        try {
            await api.post<ApiResponse<unknown>>(`/api/appointments/${appointmentId}/transfer`, {
                toDoctorId,
                reason: reason || undefined,
            });
            toast.success('Transfert effectué');
            onTransferred?.();
            onClose();
        } catch {
            // handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setToDoctorId('');
        setReason('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} backdrop="blur">
            <ModalContent>
                <ModalHeader>Transférer le rendez-vous</ModalHeader>
                <ModalBody className="space-y-3">
                    <Select
                        label="Médecin cible"
                        selectedKeys={toDoctorId ? new Set([toDoctorId]) : new Set()}
                        onSelectionChange={(keys) => {
                            if (keys === 'all') {
                                const first = doctors[0];
                                setToDoctorId(first?._id || first?.id || '');
                                return;
                            }
                            const first = Array.from(keys)[0];
                            setToDoctorId(first ? String(first) : '');
                        }}
                    >
                        {doctors.map((doctor) => {
                            const id = doctor._id || doctor.id || '';
                            return (
                                <SelectItem key={id}>
                                    {doctor.name || doctor.identifier}
                                </SelectItem>
                            );
                        })}
                    </Select>
                    <Input label="Raison (optionnel)" value={reason} onValueChange={setReason} />
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={handleClose}>
                        Annuler
                    </Button>
                    <Button color="primary" onPress={handleTransfer} isLoading={loading} isDisabled={!toDoctorId}>
                        Transférer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
