import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
} from '@heroui/react';
import type { SharedSelection } from '@heroui/system';

import type { User } from '@/lib/types';

type SpecialtyOption = {
    id: string;
    label: string;
};

type AccountForm = {
    identifier: string;
    firstName: string;
    lastName: string;
    password: string;
    roles: string[];
    specialtyIds: string[];
    isActive: boolean;
};

type AccountModalProps = {
    isOpen: boolean;
    editing: User | null;
    form: AccountForm;
    specialties: SpecialtyOption[];
    errors?: Record<string, string[]>;
    onChange: (form: AccountForm) => void;
    onClose: () => void;
    onSave: () => void;
    isSaving?: boolean;
};

type Selection = SharedSelection;

export const AccountModal = ({
    isOpen,
    editing,
    form,
    specialties,
    errors,
    onChange,
    onClose,
    onSave,
    isSaving,
}: AccountModalProps) => {
    const specialtyIdSet = new Set(specialties.map((item) => item.id));
    const selectedSpecialtyKeys = form.specialtyIds.filter((id) => specialtyIdSet.has(id));
    const nameError = errors?.name?.[0];
    const identifierError = errors?.identifier?.[0];
    const passwordError = errors?.password?.[0];
    const rolesError = errors?.roles?.[0];
    const specialtyError = errors?.specialtyIds?.[0];

    const handleSpecialtiesChange = (keys: Selection) => {
        if (keys === 'all') {
            onChange({ ...form, specialtyIds: specialties.map((item) => item.id) });
            return;
        }
        onChange({ ...form, specialtyIds: Array.from(keys).map(String) });
    };

    const handleRolesChange = (keys: Selection) => {
        if (keys === 'all') {
            onChange({ ...form, roles: ['doctor', 'admin'] });
            return;
        }
        onChange({ ...form, roles: Array.from(keys).map(String) });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>{editing ? 'Modifier un compte' : 'Nouveau compte'}</ModalHeader>
                <ModalBody className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            label="Prenom"
                            value={form.firstName}
                            onValueChange={(value) => onChange({ ...form, firstName: value })}
                        />
                        <Input
                            label="Nom"
                            value={form.lastName}
                            onValueChange={(value) => onChange({ ...form, lastName: value })}
                            isInvalid={Boolean(nameError)}
                            errorMessage={nameError}
                        />
                    </div>
                    <Input
                        label="Identifiant"
                        value={form.identifier}
                        onValueChange={(value) => onChange({ ...form, identifier: value })}
                        isRequired
                        isInvalid={Boolean(identifierError)}
                        errorMessage={identifierError}
                    />
                    <Input
                        label="Mot de passe"
                        type="password"
                        value={form.password}
                        onValueChange={(value) => onChange({ ...form, password: value })}
                        isRequired={!editing}
                        isInvalid={Boolean(passwordError)}
                        errorMessage={passwordError}
                    />
                    <Select
                        label="Specialites"
                        selectionMode="multiple"
                        selectedKeys={new Set(selectedSpecialtyKeys)}
                        onSelectionChange={handleSpecialtiesChange}
                        isDisabled={specialties.length === 0}
                        isInvalid={Boolean(specialtyError)}
                        errorMessage={specialtyError}
                    >
                        {specialties.map((specialty) => (
                            <SelectItem key={specialty.id}>
                                {specialty.label}
                            </SelectItem>
                        ))}
                    </Select>
                    {specialties.length === 0 ? (
                        <p className="text-xs text-neutral-400">
                            Aucune specialite chargee. Ajoutez des specialites dans le module admin.
                        </p>
                    ) : null}
                    <Select
                        label="Roles"
                        selectionMode="multiple"
                        selectedKeys={new Set(form.roles)}
                        onSelectionChange={handleRolesChange}
                        isInvalid={Boolean(rolesError)}
                        errorMessage={rolesError}
                    >
                        <SelectItem key="doctor">
                            doctor
                        </SelectItem>
                        <SelectItem key="admin">
                            admin
                        </SelectItem>
                    </Select>
                    <Switch isSelected={form.isActive} onValueChange={(value) => onChange({ ...form, isActive: value })}>
                        Actif
                    </Switch>
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button color="primary" onPress={onSave} isLoading={isSaving}>
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
