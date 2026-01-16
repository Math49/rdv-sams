import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

import type { Doctor } from '@/lib/types';

type DoctorFilterModalProps = {
    isOpen: boolean;
    doctors: Doctor[];
    selectedIds: string[];
    onClose: () => void;
    onApply: (ids: string[]) => void;
};

export const DoctorFilterModal = ({ isOpen, doctors, selectedIds, onClose, onApply }: DoctorFilterModalProps) => {
    const [search, setSearch] = useState('');
    const [selection, setSelection] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setSelection(new Set(selectedIds));
    }, [isOpen, selectedIds]);

    const doctorOptions = useMemo(() => {
        return doctors
            .map((doctor) => ({
                id: doctor._id || doctor.id || '',
                label: doctor.name || doctor.identifier,
            }))
            .filter((doctor) => doctor.id.length > 0);
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        if (!search.trim()) return doctorOptions;
        const query = search.trim().toLowerCase();
        return doctorOptions.filter((doctor) => doctor.label.toLowerCase().includes(query));
    }, [doctorOptions, search]);

    const toggleDoctor = (id: string) => {
        setSelection((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelection(new Set(doctorOptions.map((doctor) => doctor.id)));
    };

    const clearAll = () => {
        setSelection(new Set());
    };

    const handleApply = () => {
        onApply(Array.from(selection));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>Filtrer les soignants</ModalHeader>
                <ModalBody className="space-y-4">
                    <Input
                        label="Recherche"
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Nom ou identifiant"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="flat" onPress={selectAll}>
                            Tout sélectionner
                        </Button>
                        <Button size="sm" variant="flat" onPress={clearAll}>
                            Tout désélectionner
                        </Button>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                        {filteredDoctors.length === 0 ? (
                            <p className="text-sm text-sams-muted">Aucun soignant trouvé.</p>
                        ) : (
                            filteredDoctors.map((doctor) => (
                                <Checkbox
                                    key={doctor.id}
                                    isSelected={selection.has(doctor.id)}
                                    onValueChange={() => toggleDoctor(doctor.id)}
                                >
                                    {doctor.label}
                                </Checkbox>
                            ))
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button color="primary" onPress={handleApply}>
                        Appliquer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
