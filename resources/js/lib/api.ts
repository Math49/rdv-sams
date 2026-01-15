import axios, { AxiosError } from 'axios';
import { addToast } from '@heroui/react';

import type { ApiError } from './types';

export const api = axios.create({
    baseURL: '/',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
    },
});

const getErrorMessage = (error: AxiosError<ApiError>): string | null => {
    if (!error.response?.data) return null;

    const data = error.response.data;
    if (data.message) return data.message;

    return null;
};

const redirectOnUnauthorized = (): void => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    if (path.startsWith('/dashboard')) {
        window.location.href = '/login';
        return;
    }

    if (path.startsWith('/prise-rdv')) {
        window.location.href = '/';
    }
};

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
            redirectOnUnauthorized();
        }

        const message = getErrorMessage(error);
        if (message) {
            addToast({
                title: message,
                severity: 'danger',
                timeout: 4000,
            });
        }

        return Promise.reject(error);
    },
);

export const authApi = {
    csrf: () => api.get('/sanctum/csrf-cookie'),
    login: (payload: { identifier: string; password: string }) => api.post('/api/auth/login', payload),
    me: () => api.get('/api/auth/me'),
    logout: () => api.post('/api/auth/logout'),
};

export const patientApi = {
    validateToken: (payload: { token: string }) => api.post('/api/patient/token/validate', payload),
    getDoctor: (doctorId: string) => api.get(`/api/patient/doctors/${doctorId}`),
    getCalendars: (doctorId: string) => api.get(`/api/patient/doctors/${doctorId}/calendars`),
    getAppointmentTypes: (calendarId: string) => api.get(`/api/patient/calendars/${calendarId}/appointment-types`),
    getSlots: (params: {
        doctorId: string;
        calendarId: string;
        appointmentTypeId: string;
        from: string;
        to: string;
    }) => api.get('/api/patient/availability/slots', { params }),
    createAppointment: (payload: {
        calendarId: string;
        appointmentTypeId: string;
        startAt: string;
        patient: { lastname: string; firstname: string; phone: string; company?: string };
    }) => api.post('/api/patient/appointments', payload),
};

export const calendarApi = {
    list: () => api.get('/api/calendars'),
    updateMessage: (calendarId: string, payload: { message: string; color?: string }) =>
        api.patch(`/api/calendars/${calendarId}/message`, payload),
    appointmentTypes: (calendarId: string) => api.get(`/api/calendars/${calendarId}/appointment-types`),
    bookingToken: (calendarId: string) => api.post(`/api/calendars/${calendarId}/booking-token`),
};

export const appointmentApi = {
    list: (params: Record<string, string | string[]>) => api.get('/api/appointments', { params }),
    cancel: (id: string) => api.post(`/api/appointments/${id}/cancel`, {}),
    transfer: (id: string, payload: { toDoctorId: string; reason?: string }) =>
        api.post(`/api/appointments/${id}/transfer`, payload),
};

export const getAvailabilityFeed = (params: {
    from: string;
    to: string;
    doctorId?: string;
    doctorIds?: string[];
    calendarIds?: string[];
}) => api.get('/api/availability/feed', { params });

export const adminApi = {
    listDoctors: () => api.get('/api/admin/doctors'),
    getDoctor: (id: string) => api.get(`/api/admin/doctors/${id}`),
    createDoctor: (payload: Record<string, unknown>) => api.post('/api/admin/doctors', payload),
    updateDoctor: (id: string, payload: Record<string, unknown>) => api.patch(`/api/admin/doctors/${id}`, payload),
    deleteDoctor: (id: string) => api.delete(`/api/admin/doctors/${id}`),
    resetDoctorPassword: (id: string, payload: { password: string }) =>
        api.post(`/api/admin/doctors/${id}/reset-password`, payload),
    samsEvents: (params?: Record<string, string>) => api.get('/api/admin/sams/events', { params }),
    createSamsEvent: (payload: Record<string, unknown>) => api.post('/api/admin/sams/events', payload),
    updateSamsEvent: (id: string, payload: Record<string, unknown>) =>
        api.patch(`/api/admin/sams/events/${id}`, payload),
    deleteSamsEvent: (id: string) => api.delete(`/api/admin/sams/events/${id}`),
    specialties: () => api.get('/api/admin/specialties'),
    createSpecialty: (payload: Record<string, unknown>) => api.post('/api/admin/specialties', payload),
    updateSpecialty: (id: string, payload: Record<string, unknown>) =>
        api.patch(`/api/admin/specialties/${id}`, payload),
    deleteSpecialty: (id: string) => api.delete(`/api/admin/specialties/${id}`),
};
