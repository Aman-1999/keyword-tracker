'use client';

import { Languages } from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';
import CustomSelect, { type SelectOption } from './CustomSelect';

interface Props {
    value: string;
    onChange: (languageCode: string, languageName?: string) => void;
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

    const handleChange = (code: string) => {
        const lang = LANGUAGES.find(l => l.code === code);
        onChange(code, lang?.label);
    };

    return (
        <CustomSelect
            options={languageOptions}
            value={value}
            onChange={handleChange}
            placeholder="Select a language"
            searchable={true}
            icon={<Languages className="h-4 w-4" />}
            className={className}
        />
    );
}
