import { Award, Globe, ExternalLink, MapPin, Search, Layout, ArrowUpRight, TrendingUp } from 'lucide-react';

interface DomainOverviewProps {
    items: any[];
    userDomain: string;
}

export default function DomainOverview({ items, userDomain }: DomainOverviewProps) {
    if (!userDomain || !items) return null;

    const normalizeDomain = (url: string) => {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace('www.', '').toLowerCase();
        } catch {
            return '';
        }
    };

    const targetDomain = userDomain.replace('www.', '').toLowerCase();

    // Scan all items for the domain
    const appearances = {
        organic: [] as any[],
        local: [] as any[],
        paid: [] as any[],
        ai_reference: [] as any[],
        other: [] as any[]
    };

    items.forEach(item => {
        // Helper to check domain match
        const matches = (d: string) => d && d.toLowerCase().includes(targetDomain);
        const urlMatches = (u: string) => u && normalizeDomain(u).includes(targetDomain);

        if (item.type === 'organic') {
            if (matches(item.domain) || urlMatches(item.url)) {
                appearances.organic.push(item);
            }
        } else if (item.type === 'local_pack') {
            // Local pack often has nested items or is a flat list in advanced API
            const localItems = item.items || (Array.isArray(item) ? item : [item]);
            localItems.forEach((local: any) => {
                if (matches(local.domain) || urlMatches(local.url) || (local.title && local.title.toLowerCase().includes(targetDomain))) {
                    appearances.local.push(local);
                }
            });
        } else if (item.type === 'paid') {
            if (matches(item.domain) || urlMatches(item.url)) {
                appearances.paid.push(item);
            }
        } else if (item.type === 'ai_overview') {
            // Check references
            if (item.references) {
                item.references.forEach((ref: any) => {
                    if (matches(ref.domain) || urlMatches(ref.url)) {
                        appearances.ai_reference.push(ref);
                    }
                });
            }
        }
    });

    const totalAppearances =
        appearances.organic.length +
        appearances.local.length +
        appearances.paid.length +
        appearances.ai_reference.length;

    if (totalAppearances === 0) return null;

    // Determine Best Rank (lowest rank_absolute is best)
    const bestOrganic = appearances.organic.sort((a, b) => (a.rank_absolute || 999) - (b.rank_absolute || 999))[0];
    const bestRank = bestOrganic ? (bestOrganic.rank_group || bestOrganic.rank_absolute) : null;

    return (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl shadow-xl text-white overflow-hidden mb-8">
            {/* Header */}
            <div className="px-6 py-5 border-b border-indigo-700/50 bg-indigo-950/30 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                        <Award className="h-6 w-6 text-yellow-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Domain Overview</h2>
                        <div className="flex items-center gap-1.5 text-indigo-200 text-sm">
                            <Globe className="w-3.5 h-3.5" />
                            {userDomain}
                        </div>
                    </div>
                </div>
                <div className="hidden sm:block text-right">
                    <div className="text-sm text-indigo-300 uppercase tracking-wider font-semibold">Visibility Score</div>
                    <div className="text-2xl font-bold">{totalAppearances} Appearances</div>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Stat Cards */}
                <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
                    <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 backdrop-blur-md">
                        <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Best Rank</div>
                        <div className="text-3xl font-bold text-white">{bestRank ? `#${bestRank}` : '-'}</div>
                    </div>
                    <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 backdrop-blur-md">
                        <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Organic</div>
                        <div className="text-3xl font-bold text-white">{appearances.organic.length}</div>
                    </div>
                    <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 backdrop-blur-md">
                        <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Local Map</div>
                        <div className="text-3xl font-bold text-white">{appearances.local.length}</div>
                    </div>
                    <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-700/30 backdrop-blur-md">
                        <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">In AI Overview</div>
                        <div className="text-3xl font-bold text-white">{appearances.ai_reference.length}</div>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Organic Highlights */}
                    {appearances.organic.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                <Search className="w-4 h-4" /> Organic Results
                            </h3>
                            {appearances.organic.map((item, idx) => (
                                <div key={idx} className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                                                <h4 className="font-bold text-lg text-white group-hover:text-indigo-200 truncate flex items-center gap-2">
                                                    {item.title}
                                                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </h4>
                                                <div className="text-indigo-200 text-sm truncate mt-0.5">{item.url}</div>
                                            </a>
                                            <p className="text-sm text-indigo-100 mt-2 line-clamp-2 leading-relaxed opacity-90">{item.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                                                Rank #{item.rank_group || item.rank_absolute}
                                            </span>
                                            {item.etv > 0 && (
                                                <span className="text-xs text-indigo-300 font-medium">Est. Traffic: {item.etv.toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI Overview References */}
                    {appearances.ai_reference.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-indigo-500/30">
                            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Featured in AI Overview
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {appearances.ai_reference.map((ref, idx) => (
                                    <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" className="bg-indigo-600/20 border border-indigo-400/20 p-3 rounded-xl flex items-center gap-3 hover:bg-indigo-600/30 transition-colors">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <ArrowUpRight className="w-4 h-4 text-indigo-300" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-white truncate">{ref.title}</div>
                                            <div className="text-xs text-indigo-300 truncate">{ref.domain}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Local Pack */}
                    {appearances.local.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-indigo-500/30">
                            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Local Listings
                            </h3>
                            <div className="grid gap-3">
                                {appearances.local.map((local, idx) => (
                                    <div key={idx} className="bg-blue-500/10 border border-blue-400/20 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white">{local.title}</div>
                                            <div className="text-sm text-indigo-200">{local.address}</div>
                                        </div>
                                        <div className="text-yellow-400 font-bold flex items-center gap-1">
                                            {local.rating?.value} <span className="text-indigo-300 font-normal text-sm">({local.rating?.votes_count})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
