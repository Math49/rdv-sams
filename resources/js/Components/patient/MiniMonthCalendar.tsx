import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@heroui/react';

import { PARIS_TZ } from '@/lib/date';

const monthLabels = [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre',
];

const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const startOfWeek = (date: dayjs.Dayjs) => {
    const day = date.day();
    const diff = (day + 6) % 7;
    return date.subtract(diff, 'day');
};

type MiniMonthCalendarProps = {
    selectedDate: Date;
    onSelect: (date: Date) => void;
};

export const MiniMonthCalendar = ({ selectedDate, onSelect }: MiniMonthCalendarProps) => {
    const [month, setMonth] = useState(dayjs.tz(selectedDate, PARIS_TZ).startOf('month'));

    useEffect(() => {
        setMonth(dayjs.tz(selectedDate, PARIS_TZ).startOf('month'));
    }, [selectedDate]);

    const days = useMemo(() => {
        const start = startOfWeek(month.startOf('month'));
        const end = startOfWeek(month.endOf('month')).add(6, 'day');
        const list: dayjs.Dayjs[] = [];
        let cursor = start;
        while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
            list.push(cursor);
            cursor = cursor.add(1, 'day');
        }
        return list;
    }, [month]);

    return (
        <div className="rounded-large border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                    {monthLabels[month.month()]} {month.year()}
                </p>
                <div className="flex gap-2">
                    <Button size="sm" variant="flat" onPress={() => setMonth(month.subtract(1, 'month'))}>
                        Prev
                    </Button>
                    <Button size="sm" variant="flat" onPress={() => setMonth(month.add(1, 'month'))}>
                        Next
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
                {dayLabels.map((label, index) => (
                    <div key={`${label}-${index}`}>{label}</div>
                ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
                {days.map((day) => {
                    const isCurrentMonth = day.month() === month.month();
                    const isSelected = day.isSame(dayjs.tz(selectedDate, PARIS_TZ), 'day');
                    return (
                        <button
                            key={day.format('YYYY-MM-DD')}
                            type="button"
                            onClick={() => onSelect(day.toDate())}
                            className={`h-8 rounded-full text-xs transition ${
                                isSelected
                                    ? 'bg-blue-500 text-white'
                                    : isCurrentMonth
                                      ? 'text-white hover:bg-neutral-800'
                                      : 'text-neutral-600'
                            }`}
                        >
                            {day.date()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
