import { Search } from 'lucide-react';

interface RefinementChipsProps {
    chips: any; // The whole refinement_chips object
}

export default function RefinementChips({ chips }: RefinementChipsProps) {
    if (!chips || !chips.items || chips.items.length === 0) return null;

    return (
        <div id="refinement-chips" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-24">
            {chips.items.map((chip: any, i: number) => (
                <a
                    key={i}
                    href={chip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors shadow-sm"
                >
                    {chip.domain === 'www.google.com' && <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />}
                    {chip.title}
                </a>
            ))}
        </div>
    );
}
