import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Hash } from 'lucide-react';

interface LineNumberTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

export default function LineNumberTextarea({ value, className, ...props }: LineNumberTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const [lineCount, setLineCount] = useState(1);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const lines = value.split('\n').length;
        setLineCount(Math.max(lines, 1));
    }, [value]);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    return (
        <div className={`flex flex-col rounded-xl border transition-all overflow-hidden ${isFocused ? 'border-indigo-500 shadow-md ring-4 ring-indigo-500/10' : 'border-gray-200 shadow-sm'}`}>
            {/* Editor Header / Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2 text-xs font-medium border-b ${isFocused ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 text-gray-500">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>keywords.txt</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                    <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>{lineCount} lines</span>
                    </div>
                    {/* Add more toolbar items if needed, e.g. "Clear" */}
                </div>
            </div>

            <div className="relative flex bg-white group h-[160px]">
                {/* Line Numbers Gutter */}
                <div
                    ref={lineNumbersRef}
                    className="bg-gray-50/50 border-r border-gray-100 text-right text-gray-400 select-none overflow-hidden w-12 shrink-0"
                    style={{
                        paddingTop: '12px', // matches py-3
                        paddingBottom: '12px',
                        paddingRight: '12px',
                        lineHeight: '24px',
                        fontFamily: 'monospace, ui-monospace, SFMono-Regular'
                    }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i} style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{i + 1}</div>
                    ))}
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onScroll={handleScroll}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    spellCheck={false}
                    className={`flex-1 block w-full border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:ring-0 text-sm whitespace-pre overflow-auto ${className}`}
                    style={{
                        height: '100%',
                        resize: 'none',
                        paddingTop: '12px', // matches py-3
                        paddingBottom: '12px',
                        paddingLeft: '16px', // px-4
                        paddingRight: '16px',
                        lineHeight: '24px',
                        fontFamily: 'monospace, ui-monospace, SFMono-Regular'
                    }}
                    {...props}
                />
            </div>
        </div>
    );
}
