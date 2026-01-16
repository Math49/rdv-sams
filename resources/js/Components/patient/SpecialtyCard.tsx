import { Button, Card, CardBody } from '@heroui/react';

import type { Calendar } from '@/lib/types';

type SpecialtyCardProps = {
    calendar: Calendar;
    onSelect: () => void;
};

export const SpecialtyCard = ({ calendar, onSelect }: SpecialtyCardProps) => {
    return (
        <Card className="border border-sams-border bg-sams-surface/70">
            <CardBody className="flex flex-col gap-3">
                <div>
                    <p className="text-sm text-sams-muted">Spécialité</p>
                    <h3 className="text-lg font-semibold">{calendar.label || 'Calendrier spécialité'}</h3>
                </div>
                <Button variant="flat" onPress={onSelect}>
                    Voir les créneaux
                </Button>
            </CardBody>
        </Card>
    );
};
