import { Chip } from '@heroui/react';

type StatusPillProps = {
    value: string;
};

const mapStatus = (value: string): { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'danger' } => {
    switch (value) {
        case 'booked':
            return { label: 'Confirmé', color: 'success' };
        case 'canceled':
            return { label: 'Annulé', color: 'danger' };
        default:
            return { label: value, color: 'default' };
    }
};

export const StatusPill = ({ value }: StatusPillProps) => {
    const { label, color } = mapStatus(value);
    return (
        <Chip color={color} size="sm" variant="flat">
            {label}
        </Chip>
    );
};
