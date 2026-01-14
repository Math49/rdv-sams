import { Input } from '@heroui/react';

import type { PatientInfo } from '@/lib/types';

type PatientFormProps = {
    value: PatientInfo;
    onChange: (value: PatientInfo) => void;
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
                onValueChange={(phone) => onChange({ ...value, phone })}
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
