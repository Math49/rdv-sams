import { ReactNode } from 'react';
import { Card, CardBody } from '@heroui/react';

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
    return (
        <Card className="border border-white/10 bg-white/5">
            <CardBody className="flex flex-col items-start gap-2">
                <p className="text-base font-semibold">{title}</p>
                {description ? <p className="text-sm text-foreground/70">{description}</p> : null}
                {action ? <div className="pt-2">{action}</div> : null}
            </CardBody>
        </Card>
    );
};
