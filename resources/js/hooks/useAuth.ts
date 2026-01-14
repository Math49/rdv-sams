import { usePage } from '@inertiajs/react';

import type { PageProps, User } from '@/lib/types';

export const useAuth = (): User | null => {
    const { auth } = usePage<PageProps>().props;
    return auth?.user ?? null;
};

export const useIsAdmin = (): boolean => {
    const user = useAuth();
    return Boolean(user?.roles?.includes('admin'));
};
