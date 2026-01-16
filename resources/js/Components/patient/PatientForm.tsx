import { Input } from '@heroui/react';

import type { PatientInfo } from '@/lib/types';

type PatientFormProps = {
    value: PatientInfo;
    onChange: (value: PatientInfo) => void;
};

const formatPhone = (input: string): string => {
    const digits = input.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const PatientForm = ({ value, onChange }: PatientFormProps) => {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Input
                label="Nom"
                value={value.lastname}
                onValueChange={(lastname) => onChange({ ...value, lastname })}
                isRequired
            />
            <Input
                label="Prénom"
                value={value.firstname}
                onValueChange={(firstname) => onChange({ ...value, firstname })}
                isRequired
            />
            <Input
                label="Téléphone"
                value={value.phone}
                onValueChange={(phone) => onChange({ ...value, phone: formatPhone(phone) })}
                placeholder="(000) 000-0000"
                isRequired
            />
            <Input
                label="Entreprise"
                value={value.company || ''}
                onValueChange={(company) => onChange({ ...value, company })}
            />
        </div>
    );
};
