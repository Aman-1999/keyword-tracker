'use client';

import { Settings } from 'lucide-react';
import CustomSelect, { type SelectOption } from './CustomSelect';

interface Props {
    value: string;
    onChange: (os: string) => void;
    className?: string;
}

const OS_OPTIONS: SelectOption[] = [
    { value: 'windows', label: 'Windows' },
    { value: 'macos', label: 'macOS' },
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
    { value: 'linux', label: 'Linux' },
];

export default function OSSelect({ value, onChange, className = '' }: Props) {
    return (
        <CustomSelect
            options={OS_OPTIONS}
            value={value}
            onChange={onChange}
            placeholder="Select operating system"
            icon={<Settings className="h-4 w-4" />}
            className={className}
        />
    );
}
