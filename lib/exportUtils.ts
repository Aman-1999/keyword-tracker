// Export utilities for ranking results

export interface ExportData {
    keyword: string;
    rank: number | null;
    url: string | null;
    title: string | null;
    competitor1?: string;
    competitor2?: string;
    competitor3?: string;
}

/**
 * Export data as JSON
 */
export function exportAsJSON(data: ExportData[], filename: string = 'ranking-results') {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
}

/**
 * Export data as CSV
 */
export function exportAsCSV(data: ExportData[], filename: string = 'ranking-results') {
    const headers = ['Keyword', 'Rank', 'URL', 'Title', 'Competitor 1', 'Competitor 2', 'Competitor 3'];

    const csvRows = [
        headers.join(','),
        ...data.map(row => [
            escapeCSV(row.keyword),
            row.rank || '-',
            escapeCSV(row.url || '-'),
            escapeCSV(row.title || '-'),
            escapeCSV(row.competitor1 || '-'),
            escapeCSV(row.competitor2 || '-'),
            escapeCSV(row.competitor3 || '-'),
        ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as Excel (using CSV format with .xlsx extension for simplicity)
 * For true Excel format, would need a library like xlsx
 */
export function exportAsExcel(data: ExportData[], filename: string = 'ranking-results') {
    // For now, using CSV format which Excel can open
    // To implement true .xlsx, install 'xlsx' package
    exportAsCSV(data, filename);
}

/**
 * Helper to escape CSV values
 */
function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Helper to download blob
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Prepare data for export from results
 */
export function prepareExportData(results: any[]): ExportData[] {
    return results.map(result => ({
        keyword: result.keyword,
        rank: result.rank,
        url: result.url,
        title: result.title,
        competitor1: result.top_rankers?.[0]?.domain || undefined,
        competitor2: result.top_rankers?.[1]?.domain || undefined,
        competitor3: result.top_rankers?.[2]?.domain || undefined,
    }));
}
