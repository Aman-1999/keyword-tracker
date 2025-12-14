import { Search } from 'lucide-react';

interface RelatedSearchesProps {
    items: any[];
}

export default function RelatedSearches({ items }: RelatedSearchesProps) {
    // related_searches item usually contains an 'items' array of strings or objects
    // Based on provided JSON: { type: "related_searches", ..., items: ["String 1", "String 2"] }
    // Or sometimes objects. Let's handle both.

    if (!items || items.length === 0) return null;

    // Flatten if multiple related_search sections exist
    const allSearches = items.flatMap(section => section.items || []);

    if (allSearches.length === 0) return null;

    return (
        <div id="related-searches" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-24">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                Related Searches
            </h3>
            <div className="flex flex-wrap gap-3">
                {allSearches.map((term: string | any, i: number) => {
                    const text = typeof term === 'string' ? term : term.title || term.text;
                    const url = typeof term === 'string' ? `https://www.google.com/search?q=${encodeURIComponent(term)}` : term.url;

                    return (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all"
                        >
                            {text}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
