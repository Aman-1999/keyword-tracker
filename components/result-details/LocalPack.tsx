import { MapPin, Star, Phone, Clock } from 'lucide-react';

interface LocalPackProps {
    items: any[];
}

export default function LocalPack({ items }: LocalPackProps) {
    if (!items || items.length === 0) return null;

    // Support both flattened array (one item per business) and nested items
    // If the first item has 'domain' or 'title' directly, it's a flat list (Advanced API)
    // If it has 'items' array, it's the Regular API structure
    let businesses: any[] = [];

    if (items[0].items) {
        // Regular API structure where items are grouped in one 'local_pack' item
        businesses = items.flatMap(i => i.items || []);
    } else {
        // Advanced API structure (flat list)
        businesses = items;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">Local Pack</h2>
            </div>
            <div className="p-6 space-y-4">
                {businesses.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-100">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                                {item.is_paid && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Ad</span>
                                )}
                            </div>

                            {item.rating && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold text-gray-900">{item.rating.value}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">({item.rating.votes_count} reviews)</span>
                                </div>
                            )}

                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                {item.address && (
                                    <p className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        {item.address}
                                    </p>
                                )}
                                {item.phone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        {item.phone}
                                    </p>
                                )}
                                {item.description && !item.description.includes(item.phone) && (
                                    <p className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            {item.url && (
                                <div className="mt-3">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                                    >
                                        Visit Website
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
