import type { PatientTokenContext } from './types';

const KEY = 'patient_context';

export const savePatientContext = (context: PatientTokenContext): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEY, JSON.stringify(context));
};

export const getPatientContext = (): PatientTokenContext | null => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as PatientTokenContext;
    } catch {
        return null;
    }
};

export const clearPatientContext = (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(KEY);
};
