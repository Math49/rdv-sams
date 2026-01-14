import { Button, Card, CardBody } from '@heroui/react';

import type { Calendar } from '@/lib/types';

type VmCardProps = {
    calendar: Calendar;
    onSelect: () => void;
};

export const VmCard = ({ calendar, onSelect }: VmCardProps) => {
    return (
        <Card className="border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
            <CardBody className="flex flex-col gap-3">
                <div>
                    <p className="text-sm text-foreground/70">Visite médicale</p>
                    <h3 className="text-lg font-semibold">{calendar.label || 'Calendrier médecin'}</h3>
                </div>
                <Button color="primary" onPress={onSelect}>
                    Prendre rendez-vous
                </Button>
            </CardBody>
        </Card>
    );
};
