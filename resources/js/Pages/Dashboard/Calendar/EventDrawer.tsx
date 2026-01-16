import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, Divider } from '@heroui/react';

import { formatDateTimeFR } from '@/lib/date';
import type { Appointment } from '@/lib/types';
import { SectionCard } from '@/Components/ui/SectionCard';
import { StatusPill } from '@/Components/ui/StatusPill';

type EventDrawerProps = {
    isOpen: boolean;
    appointment: Appointment | null;
    calendarLabel?: string | null;
    doctorName?: string | null;
    onClose: () => void;
    onTransfer: () => void;
    onCancel: () => void;
};

export const EventDrawer = ({
    isOpen,
    appointment,
    calendarLabel,
    doctorName,
    onClose,
    onTransfer,
    onCancel,
}: EventDrawerProps) => {
    if (!appointment) {
        return (
            <Drawer isOpen={isOpen} onClose={onClose} placement="right">
                <DrawerContent>
                    <DrawerHeader>Rendez-vous</DrawerHeader>
                    <DrawerBody>Aucun rendez-vous sélectionné.</DrawerBody>
                </DrawerContent>
            </Drawer>
        );
    }

    const patientName = [appointment.patient?.firstname, appointment.patient?.lastname].filter(Boolean).join(' ') || 'Patient';
    const patientPhone = appointment.patient?.phone;
    const patientCompany = appointment.patient?.company;
    const calendarDisplay = calendarLabel || appointment.calendarId;
    const doctorDisplay = doctorName || appointment.doctorId;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} placement="right">
            <DrawerContent>
                <DrawerHeader className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-sams-muted">Rendez-vous</p>
                        <h3 className="text-lg font-semibold">{patientName}</h3>
                    </div>
                    <StatusPill value={appointment.status} />
                </DrawerHeader>
                <Divider className="opacity-40" />
                <DrawerBody className="space-y-4">
                    <SectionCard title="Patient">
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold">{patientName}</p>
                            {patientPhone ? <p className="text-sams-text/80">{patientPhone}</p> : null}
                            {patientCompany ? <p className="text-sams-muted">{patientCompany}</p> : null}
                        </div>
                    </SectionCard>

                    <SectionCard title="RDV">
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-sams-muted">Creneau</p>
                                <p className="font-semibold">{formatDateTimeFR(appointment.startAt)}</p>
                                <p className="text-sams-muted">{formatDateTimeFR(appointment.endAt)}</p>
                            </div>
                            {appointment.reason ? (
                                <div>
                                    <p className="text-sams-muted">Raison</p>
                                    <p>{appointment.reason}</p>
                                </div>
                            ) : null}
                        </div>
                    </SectionCard>

                    <SectionCard title="Calendrier">
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold">{calendarDisplay || 'Calendrier'}</p>
                            {doctorDisplay ? <p className="text-sams-muted">Soignant: {doctorDisplay}</p> : null}
                        </div>
                    </SectionCard>

                    <SectionCard title="Actions">
                        <div className="flex flex-wrap gap-2">
                            <Button variant="flat" onPress={onTransfer}>
                                Transférer
                            </Button>
                            <Button color="danger" onPress={onCancel}>
                                Annuler
                            </Button>
                        </div>
                    </SectionCard>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
};
