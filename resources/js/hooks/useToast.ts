import { addToast } from '@heroui/react';

type ToastSeverity = 'default' | 'success' | 'warning' | 'danger';

const pushToast = (title: string, severity: ToastSeverity, description?: string): void => {
    addToast({
        title,
        description,
        severity,
        timeout: 4000,
    });
};

export const useToast = () => {
    return {
        success: (title: string, description?: string) => pushToast(title, 'success', description),
        error: (title: string, description?: string) => pushToast(title, 'danger', description),
        warning: (title: string, description?: string) => pushToast(title, 'warning', description),
        info: (title: string, description?: string) => pushToast(title, 'default', description),
    };
};

export const toast = {
    success: (title: string, description?: string) => pushToast(title, 'success', description),
    error: (title: string, description?: string) => pushToast(title, 'danger', description),
    warning: (title: string, description?: string) => pushToast(title, 'warning', description),
    info: (title: string, description?: string) => pushToast(title, 'default', description),
};
