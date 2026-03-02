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

async function testCreate() {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Task Name': { title: [{ text: { content: 'Test Request' } }] },
        'Requested By': { email: 'test@ghostbond.com' } 
      }
    });
    console.log('Create success:', response.id);
  } catch (error) {
    console.error('Create Error:', error.body || error.message);
  }
}

async function testQuery() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Requested By',
        email: {
          equals: 'test@ghostbond.com' 
        }
      }
    });
    console.log('Query success:', response.results.length);
  } catch (error) {
    console.error('Query Error:', error.body || error.message);
  }
}

testCreate().then(testQuery);
