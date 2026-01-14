import { ToastProvider as HeroToastProvider } from '@heroui/react';

export const ToastProvider = () => {
    return (
        <HeroToastProvider
            placement="top-right"
            maxVisibleToasts={3}
            toastOffset={24}
            toastProps={{
                radius: 'lg',
                variant: 'flat',
            }}
        />
    );
};
