import { Client } from '@notionhq/client';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if(k && v) env[k.trim()] = v.replace(/"/g, '').trim();
});

const notion = new Client({ auth: env.NOTION_API_KEY });
const DATABASE_ID = env.NOTION_DATABASE_ID;

async function run() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 10
    });
    console.log('Total tasks in DB:', response.results.length);
    if (response.results.length > 0) {
      console.log('Sample properties of first task:');
      const props = response.results[0].properties;
      console.log('Requested By:', JSON.stringify(props['Requested By']));
      console.log('Status:', JSON.stringify(props['Status']));
    }
  } catch (error) {
    console.error('Error:', error.body || error.message);
  }
}

run();
