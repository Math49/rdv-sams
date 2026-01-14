import { ReactNode } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';

type SectionCardProps = {
    title?: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
};

export const SectionCard = ({ title, description, actions, children }: SectionCardProps) => {
    return (
        <Card className="border border-white/10 bg-white/5">
            {(title || actions || description) && (
                <CardHeader className="flex w-full items-start justify-between gap-4">
                    <div>
                        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
                        {description ? (
                            <p className="mt-1 text-sm text-foreground/70">{description}</p>
                        ) : null}
                    </div>
                    {actions ? <div>{actions}</div> : null}
                </CardHeader>
            )}
            <CardBody className="space-y-4">{children}</CardBody>
        </Card>
    );
};
