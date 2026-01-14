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
        window.location.href = '/dashboard/login';
        return;
    }

    if (path.startsWith('/patient')) {
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
