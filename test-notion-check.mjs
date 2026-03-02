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

async function check() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 10
    });
    console.log(`Found ${response.results.length} tasks`);
    response.results.forEach((task, i) => {
      const props = task.properties;
      console.log(`\n--- Task ${i + 1} ---`);
      console.log(`Name:`, props['Task Name']?.title?.[0]?.plain_text);
      console.log(`Requested By:`, JSON.stringify(props['Requested By']));
      console.log(`Requester Email:`, JSON.stringify(props['Requester Email']));
    });
  } catch (err) {
    console.error(err.message || err);
  }
}
check();
