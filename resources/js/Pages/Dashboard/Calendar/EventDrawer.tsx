import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    Divider,
} from '@heroui/react';

import { formatDateTime } from '@/lib/date';
import type { Appointment } from '@/lib/types';
import { StatusPill } from '@/Components/ui/StatusPill';

type EventDrawerProps = {
    isOpen: boolean;
    appointment: Appointment | null;
    onClose: () => void;
    onTransfer: () => void;
    onCancel: () => void;
};

export const EventDrawer = ({ isOpen, appointment, onClose, onTransfer, onCancel }: EventDrawerProps) => {
    if (!appointment) {
        return (
            <Drawer isOpen={isOpen} onClose={onClose} placement="right">
                <DrawerContent>
                    <DrawerHeader>Rendez-vous</DrawerHeader>
                    <DrawerBody>Aucun rendez-vous selectionne.</DrawerBody>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Drawer isOpen={isOpen} onClose={onClose} placement="right">
            <DrawerContent>
                <DrawerHeader className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-foreground/70">Rendez-vous</p>
                        <h3 className="text-lg font-semibold">{appointment.patient?.lastname ?? 'Patient'}</h3>
                    </div>
                    <StatusPill value={appointment.status} />
                </DrawerHeader>
                <Divider className="opacity-40" />
                <DrawerBody className="space-y-4">
                    <div>
                        <p className="text-xs uppercase text-foreground/60">Creneau</p>
                        <p className="text-sm">{formatDateTime(appointment.startAt)}</p>
                        <p className="text-sm text-foreground/70">{formatDateTime(appointment.endAt)}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-foreground/60">Patient</p>
                        <p className="text-sm">
                            {appointment.patient?.firstname} {appointment.patient?.lastname}
                        </p>
                        <p className="text-sm text-foreground/70">{appointment.patient?.phone}</p>
                        {appointment.patient?.company ? (
                            <p className="text-sm text-foreground/70">{appointment.patient.company}</p>
                        ) : null}
                    </div>
                </DrawerBody>
                <DrawerFooter className="gap-2">
                    <Button variant="flat" onPress={onTransfer}>
                        Transferer
                    </Button>
                    <Button color="danger" onPress={onCancel}>
                        Annuler
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
