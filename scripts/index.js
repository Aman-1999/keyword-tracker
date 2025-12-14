const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs/promises');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { getTaskResult } = require('../lib/dataForSeoTaskPost');

async function main(id) {
    try {
        const result = await getTaskResult(id, true);

        const filePath = path.resolve(
            process.cwd(),
            `dataforseo-result-${id}.json`
        );

        await fs.writeFile(filePath, JSON.stringify(result, null, 2));
        console.log('✅ Saved:', filePath);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main('12141134-1247-0066-0000-fe8594069210');
