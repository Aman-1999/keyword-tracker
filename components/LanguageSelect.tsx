'use client';

import { Languages } from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';
import CustomSelect, { type SelectOption } from './CustomSelect';

interface Props {
    value: string;
    onChange: (languageCode: string) => void;
    className?: string;
}

export default function LanguageSelect({ value, onChange, className = '' }: Props) {
    // Convert languages to select options
    const languageOptions: SelectOption[] = LANGUAGES.map(lang => ({
        value: lang.code,
        label: lang.label,
        subtext: lang.nativeName && lang.nativeName !== lang.label
            ? `${lang.code} - ${lang.nativeName}`
            : lang.code,
    }));

    return (
        <CustomSelect
            options={languageOptions}
            value={value}
            onChange={onChange}
            placeholder="Select a language"
            searchable={true}
            icon={<Languages className="h-4 w-4" />}
            className={className}
        />
    );
}
