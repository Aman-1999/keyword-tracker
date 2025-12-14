import { Award, ExternalLink, Globe, TrendingUp } from 'lucide-react';

interface MyRankingCardProps {
    items: any[];
    userDomain: string; // The domain to search for (from history search params)
}

export default function MyRankingCard({ items, userDomain }: MyRankingCardProps) {
    if (!userDomain) return null;

    // Find the user's domain in organic results
    const organicResults = items.filter(item => item.type === 'organic');
    const userResult = organicResults.find(item =>
        item.domain && item.domain.toLowerCase().includes(userDomain.replace('www.', '').toLowerCase())
    );

    if (!userResult) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white overflow-hidden">
            <div className="px-6 py-4 bg-white/10 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-yellow-300" />
                    <h2 className="font-bold text-lg">My Ranking</h2>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                    Found at Position #{userResult.rank_absolute || userResult.rank_group}
                </div>
            </div>

            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-100 text-sm">
                            <Globe className="w-4 h-4" />
                            {userResult.domain}
                        </div>

                        <a
                            href={userResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold hover:underline flex items-start gap-2 group leading-snug"
                        >
                            {userResult.title}
                            <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                        </a>

                        <p className="text-indigo-100 leading-relaxed text-sm md:text-base">
                            {userResult.description}
                        </p>
                    </div>

                    <div className="flex gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Rank</div>
                            <div className="text-3xl font-bold">{userResult.rank_absolute || userResult.rank_group}</div>
                        </div>
                        {userResult.etv && (
                            <div className="text-center border-l border-white/20 pl-4">
                                <div className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Traffic</div>
                                <div className="text-3xl font-bold">{userResult.etv.toFixed(1)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
