import dayjs from 'dayjs';
import { Button } from '@heroui/react';

import type { AvailabilitySlot } from '@/lib/types';
import { formatTime, PARIS_TZ } from '@/lib/date';

type SlotsGridProps = {
    days: Date[];
    slots: AvailabilitySlot[];
    selectedSlotStart?: string | null;
    onSelect: (slot: AvailabilitySlot) => void;
};

export const SlotsGrid = ({ days, slots, selectedSlotStart, onSelect }: SlotsGridProps) => {
    const slotsByDay = new Map<string, AvailabilitySlot[]>();

    slots.forEach((slot) => {
        const key = dayjs.tz(slot.startAt, PARIS_TZ).format('DD/MM/YYYY');
        const list = slotsByDay.get(key) ?? [];
        list.push(slot);
        slotsByDay.set(key, list);
    });

    days.forEach((day) => {
        const key = dayjs.tz(day, PARIS_TZ).format('DD/MM/YYYY');
        const list = slotsByDay.get(key);
        if (list) {
            list.sort((a, b) => dayjs.tz(a.startAt, PARIS_TZ).valueOf() - dayjs.tz(b.startAt, PARIS_TZ).valueOf());
        }
    });

    const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="grid gap-4 lg:grid-cols-7">
            {days.map((day) => {
                const key = dayjs.tz(day, PARIS_TZ).format('DD/MM/YYYY');
                const list = slotsByDay.get(key) || [];
                const dayIndex = (dayjs.tz(day, PARIS_TZ).day() + 6) % 7;
                return (
                    <div key={key} className="space-y-2">
                        <div className="text-center">
                            <p className="text-xs text-sams-muted">{dayLabels[dayIndex]}</p>
                            <p className="text-sm font-semibold text-sams-text">{dayjs.tz(day, PARIS_TZ).date()}</p>
                        </div>
                        <div className="space-y-2">
                            {list.length === 0 ? (
                                <p className="text-center text-xs text-sams-muted/60">-</p>
                            ) : (
                                list.map((slot) => {
                                    const isSelected = selectedSlotStart === slot.startAt;
                                    return (
                                        <Button
                                            key={slot.startAt}
                                            radius="full"
                                            size="sm"
                                            variant={isSelected ? 'solid' : 'bordered'}
                                            color={isSelected ? 'primary' : 'default'}
                                            className="w-full justify-center"
                                            onPress={() => onSelect(slot)}
                                        >
                                            {formatTime(slot.startAt)}
                                        </Button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
