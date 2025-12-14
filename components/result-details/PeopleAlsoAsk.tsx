import { HelpCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PeopleAlsoAskProps {
    items: any[];
}

export default function PeopleAlsoAsk({ items }: PeopleAlsoAskProps) {
    if (!items || items.length === 0) return null;

    // Flatten all PAA items
    const questions = items.flatMap((paa: any) => paa.items || []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="font-bold text-gray-900">People Also Ask</h2>
            </div>
            <div className="divide-y divide-gray-100">
                {questions.map((qa: any, i: number) => (
                    <QuestionItem key={i} question={qa} />
                ))}
            </div>
        </div>
    );
}

function QuestionItem({ question }: { question: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <span className="font-medium text-gray-900">{question.title}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 pt-2 bg-gray-50/50">
                    {question.expanded_element?.map((el: any, j: number) => (
                        <div key={j} className="text-sm text-gray-700 space-y-2">
                            {el.description && <p className="leading-relaxed">{el.description}</p>}
                            {el.url && (
                                <a href={el.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium mt-2">
                                    Read more <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
