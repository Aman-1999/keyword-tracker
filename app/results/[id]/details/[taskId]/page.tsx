'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ResultHeader from '@/components/result-details/ResultHeader';
import DomainOverview from '@/components/result-details/DomainOverview';
import AIOverview from '@/components/result-details/AIOverview';
import PeopleAlsoAsk from '@/components/result-details/PeopleAlsoAsk';
import OrganicResultsList from '@/components/result-details/OrganicResultsList';
import LocalPack from '@/components/result-details/LocalPack';
import RefinementChips from '@/components/result-details/RefinementChips';
import RelatedSearches from '@/components/result-details/RelatedSearches';

export default function ResultDetailsPage() {
    const params = useParams();
    const historyId = params.id as string;
    const taskId = params.taskId as string;

    const [result, setResult] = useState<any>(null);
    const [userDomain, setUserDomain] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRawJson, setShowRawJson] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch the specific Task Result
                const resultRes = await fetch(`/api/result/${taskId}`);
                if (!resultRes.ok) {
                    if (resultRes.status === 404) throw new Error('Result not found');
                    throw new Error('Failed to fetch result');
                }
                const resultData = await resultRes.json();
                setResult(resultData);

                // 2. Fetch the Search Context (to get the tracked domain)
                // We use the existing history endpoint which returns { history: { domain: ... } }
                const historyRes = await fetch(`/api/check-rank/results/${historyId}`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    if (historyData.history && historyData.history.domain) {
                        setUserDomain(historyData.history.domain);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (taskId && historyId) {
            fetchData();
        }
    }, [taskId, historyId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <Navbar />
                <div className="max-w-3xl mx-auto mt-20 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Result</h2>
                        <p className="text-gray-600 mb-6">{error || 'Result not found'}</p>
                        <Link
                            href={`/results/${historyId}`}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Results
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const items = result?.items || [];
    const aiOverview = items.filter((i: any) => i.type === 'ai_overview');
    const peopleAlsoAsk = items.filter((i: any) => i.type === 'people_also_ask');
    const organicResults = items.filter((i: any) => i.type === 'organic');
    const localPack = items.filter((i: any) => i.type === 'local_pack');
    const relatedSearches = items.filter((i: any) => i.type === 'related_searches');

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

                <ResultHeader
                    historyId={historyId}
                    keyword={result.keyword}
                    language_code={result.language_code}
                    location_code={result.location_code}
                    location_name={result.location_name}
                    device={result.device}
                    os={result.os}
                    check_url={result.check_url}
                    se_results_count={result.se_results_count}
                    datetime={result.datetime || new Date().toISOString()}
                />
                <RefinementChips chips={result.refinement_chips} />
                <div className="space-y-6">
                    {items.length > 0 && <DomainOverview items={items} userDomain={userDomain} />}
                    {aiOverview.length > 0 && <AIOverview items={aiOverview} />}
                    {localPack.length > 0 && <LocalPack items={localPack} />}
                    {peopleAlsoAsk.length > 0 && <PeopleAlsoAsk items={peopleAlsoAsk} />}
                    {organicResults.length > 0 && <OrganicResultsList items={organicResults} />}
                    {relatedSearches.length > 0 && <RelatedSearches items={relatedSearches} />}
                </div>

            </main>
        </div>
    );
}
