import { Input, Select, SelectItem } from '@heroui/react';

import type { Calendar } from '@/lib/types';

export type CalendarFilterState = {
    from: string;
    to: string;
    calendarIds: string[];
};

type Selection = 'all' | Set<string>;

type CalendarFiltersProps = {
    calendars: Calendar[];
    value: CalendarFilterState;
    onChange: (value: CalendarFilterState) => void;
};

export const CalendarFilters = ({ calendars, value, onChange }: CalendarFiltersProps) => {
    const selection = new Set(value.calendarIds);

    const handleCalendarChange = (keys: Selection) => {
        if (keys === 'all') {
            const allIds = calendars
                .map((calendar) => calendar._id || calendar.id)
                .filter((id): id is string => Boolean(id));
            onChange({ ...value, calendarIds: allIds });
            return;
        }

        const ids = Array.from(keys).map(String);
        onChange({ ...value, calendarIds: ids });
    };

    return (
        <div className="grid gap-3 md:grid-cols-3">
            <Input
                type="date"
                label="Du"
                value={value.from}
                onValueChange={(from) => onChange({ ...value, from })}
            />
            <Input
                type="date"
                label="Au"
                value={value.to}
                onValueChange={(to) => onChange({ ...value, to })}
            />
            <Select
                label="Calendriers"
                selectionMode="multiple"
                selectedKeys={selection}
                onSelectionChange={handleCalendarChange}
            >
                {calendars.map((calendar) => {
                    const id = calendar._id || calendar.id || '';
                    return (
                        <SelectItem key={id} value={id}>
                            {calendar.label || `${calendar.scope} calendar`}
                        </SelectItem>
                    );
                })}
            </Select>
        </div>
    );
};
