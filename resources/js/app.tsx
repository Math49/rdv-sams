import '../css/app.css';

import { HeroUIProvider } from '@heroui/react';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ToastProvider } from './Components/ui/ToastProvider';

const appName = 'RDV-SAMS';

if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <HeroUIProvider navigate={(href) => router.visit(String(href))}>
                    <ToastProvider />
                    <App {...props} />
                </HeroUIProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
