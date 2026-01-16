import { useState } from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from '@heroui/react';

import { CopyToClipboardButton } from '@/Components/ui/CopyToClipboardButton';
import { api } from '@/lib/api';
import { formatDateTimeFR } from '@/lib/date';
import type { ApiResponse, BookingTokenResponse, Calendar } from '@/lib/types';
import { toast } from '@/hooks/useToast';

type GenerateTokenModalProps = {
    isOpen: boolean;
    calendars: Calendar[];
    onClose: () => void;
};

export const GenerateTokenModal = ({ isOpen, calendars, onClose }: GenerateTokenModalProps) => {
    const [calendarId, setCalendarId] = useState('');
    const [token, setToken] = useState<BookingTokenResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!calendarId) return;
        setLoading(true);
        try {
            const response = await api.post<ApiResponse<BookingTokenResponse>>(
                `/api/calendars/${calendarId}/booking-token`,
            );
            setToken(response.data.data);
            toast.success('Token genere');
        } catch {
            // handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCalendarId('');
        setToken(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} backdrop="blur" size="lg">
            <ModalContent>
                <ModalHeader>Générer un token patient</ModalHeader>
                <ModalBody className="space-y-4">
                    <Select
                        label="Calendrier"
                        selectedKeys={calendarId ? new Set([calendarId]) : new Set()}
                        onSelectionChange={(keys) => {
                            if (keys === 'all') {
                                const first = calendars[0];
                                setCalendarId(first?._id || first?.id || '');
                                return;
                            }
                            const first = Array.from(keys)[0];
                            setCalendarId(first ? String(first) : '');
                        }}
                    >
                        {calendars.map((calendar) => {
                            const id = calendar._id || calendar.id || '';
                            const fallback =
                                calendar.scope === 'doctor' ? 'Personnel' : calendar.scope === 'specialty' ? 'Spécialité' : 'SAMS';
                            return (
                                <SelectItem key={id}>
                                    {calendar.label || fallback}
                                </SelectItem>
                            );
                        })}
                    </Select>

                    {token ? (
                        <div className="space-y-2 rounded-large border border-sams-border bg-sams-surface p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">Token :</p>
                                <code className="text-sm text-sams-text/80">{token.token}</code>
                                <CopyToClipboardButton value={token.token} />
                            </div>
                            {token.message ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">Message :</p>
                                    <p className="text-sm text-sams-muted">{token.message}</p>
                                    <CopyToClipboardButton value={token.message} label="Copier le message" />
                                </div>
                            ) : null}
                            <p className="text-xs text-sams-muted/70">Expire le {formatDateTimeFR(token.expiresAt)}</p>
                        </div>
                    ) : null}
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button variant="light" onPress={handleClose}>
                        Fermer
                    </Button>
                    <Button color="primary" onPress={handleGenerate} isLoading={loading} isDisabled={!calendarId}>
                        Générer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
