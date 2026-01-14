import { ReactNode } from 'react';
import { Divider } from '@heroui/react';

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-foreground/70">{subtitle}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
            <Divider className="opacity-40" />
        </div>
    );
};
