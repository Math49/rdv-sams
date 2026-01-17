import { ReactNode } from 'react';

import { MiniMonthCalendar } from './MiniMonthCalendar';
import { SlotsGrid } from './SlotsGrid';
import type { AvailabilitySlot } from '@/lib/types';

type GoogleLikeBookingLayoutProps = {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    days: Date[];
    slots: AvailabilitySlot[];
    selectedSlotStart?: string | null;
    onSelectSlot: (slot: AvailabilitySlot) => void;
    header?: ReactNode;
    minDate?: Date | null;
    maxDate?: Date | null;
    bookingWindowMessage?: string | null;
};

export const GoogleLikeBookingLayout = ({
    selectedDate,
    onSelectDate,
    days,
    slots,
    selectedSlotStart,
    onSelectSlot,
    header,
    minDate,
    maxDate,
    bookingWindowMessage,
}: GoogleLikeBookingLayoutProps) => {
    return (
        <div className="rounded-large border border-sams-border bg-sams-surface p-6">
            <div className="flex flex-col gap-6">
                {header ? <div>{header}</div> : null}
                {bookingWindowMessage ? (
                    <div className="rounded-medium bg-sams-accent/10 px-4 py-3 text-sm text-sams-accent">
                        {bookingWindowMessage}
                    </div>
                ) : null}
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <MiniMonthCalendar
                        selectedDate={selectedDate}
                        onSelect={onSelectDate}
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-sams-muted">
                            <p>Sélectionner une heure de rendez-vous</p>
                            <p>Heure locale</p>
                        </div>
                        <SlotsGrid
                            days={days}
                            slots={slots}
                            selectedSlotStart={selectedSlotStart}
                            onSelect={onSelectSlot}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
