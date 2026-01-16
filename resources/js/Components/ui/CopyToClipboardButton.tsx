import { useState } from 'react';
import { Button } from '@heroui/react';

type CopyToClipboardButtonProps = {
    value: string;
    label?: string;
};

export const CopyToClipboardButton = ({ value, label = 'Copier' }: CopyToClipboardButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <Button size="sm" variant="flat" onPress={handleCopy}>
            {copied ? 'Copié' : label}
        </Button>
    );
};
