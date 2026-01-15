import { Button } from '@heroui/react';

import { formatDateTimeFR } from '@/lib/date';
import type { AvailabilitySlot } from '@/lib/types';

type SlotListProps = {
    slots: AvailabilitySlot[];
    selected?: string | null;
    onSelect: (slot: AvailabilitySlot) => void;
};

export const SlotList = ({ slots, selected, onSelect }: SlotListProps) => {
    if (slots.length === 0) {
        return <p className="text-sm text-foreground/60">Aucun creneau disponible.</p>;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {slots.map((slot) => {
                const isSelected = selected === slot.startAt;
                return (
                    <Button
                        key={slot.startAt}
                        variant={isSelected ? 'solid' : 'flat'}
                        color={isSelected ? 'primary' : 'default'}
                        onPress={() => onSelect(slot)}
                    >
                        {formatDateTimeFR(slot.startAt)}
                    </Button>
                );
            })}
        </div>
    );
};
