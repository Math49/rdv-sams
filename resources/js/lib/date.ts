import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const formatDate = (value?: string | Date | null): string => {
    if (!value) return '';
    return dayjs(value).format('DD/MM/YYYY');
};

export const formatTime = (value?: string | Date | null): string => {
    if (!value) return '';
    return dayjs(value).format('HH:mm');
};

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return '';
    return dayjs(value).format('DD/MM/YYYY HH:mm');
};

export const toDateTimeLocal = (value?: string | Date | null): string => {
    if (!value) return '';
    return dayjs(value).format('YYYY-MM-DDTHH:mm');
};

export const toIsoUtc = (value: string | Date): string => {
    return dayjs(value).utc().toISOString();
};

export const startOfDayUtc = (value: string | Date): string => {
    return dayjs(value).utc().startOf('day').toISOString();
};

export const endOfDayUtc = (value: string | Date): string => {
    return dayjs(value).utc().endOf('day').toISOString();
};

export const addMinutesUtc = (value: string | Date, minutes: number): string => {
    return dayjs(value).utc().add(minutes, 'minute').toISOString();
};
