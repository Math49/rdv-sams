import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

export const PARIS_TZ = 'Europe/Paris';
dayjs.tz.setDefault(PARIS_TZ);

const toParis = (value?: string | Date | null): dayjs.Dayjs | null => {
    if (!value) return null;
    return dayjs.tz(value, PARIS_TZ);
};

export const formatDate = (value?: string | Date | null): string => {
    const date = toParis(value);
    if (!date) return '';
    return date.format('YYYY-MM-DD');
};

export const formatTime = (value?: string | Date | null): string => {
    const date = toParis(value);
    if (!date) return '';
    return date.format('HH:mm');
};

export const formatDateTime = (value?: string | Date | null): string => {
    const date = toParis(value);
    if (!date) return '';
    return date.format('YYYY-MM-DD HH:mm');
};

export const formatDateTimeFR = (value?: string | Date | null): string => {
    const date = toParis(value);
    if (!date) return '';
    return date.format('DD/MM/YYYY HH:mm');
};

export const toDateTimeLocal = (value?: string | Date | null): string => {
    const date = toParis(value);
    if (!date) return '';
    return date.format('YYYY-MM-DDTHH:mm');
};

export const toIsoParis = (value: string | Date): string => {
    return dayjs.tz(value, PARIS_TZ).format();
};

export const startOfDayParis = (value: string | Date): string => {
    return dayjs.tz(value, PARIS_TZ).startOf('day').format();
};

export const endOfDayParis = (value: string | Date): string => {
    return dayjs.tz(value, PARIS_TZ).endOf('day').format();
};

export const addMinutesParis = (value: string | Date, minutes: number): string => {
    return dayjs.tz(value, PARIS_TZ).add(minutes, 'minute').format();
};

export const toIsoUtc = toIsoParis;
export const startOfDayUtc = startOfDayParis;
export const endOfDayUtc = endOfDayParis;
export const addMinutesUtc = addMinutesParis;
