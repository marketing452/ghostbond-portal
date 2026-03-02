require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function testQuery() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Requested By',
        email: {
          equals: 'test@ghostbond.com' // testing email filter condition
        }
      }
    });
    console.log('Query success:', response.results.length);
  } catch (error) {
    console.error('Query Error:', error.body || error);
  }
}

async function testCreate() {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Task Name': { title: [{ text: { content: 'Test Request' } }] },
        'Requested By': { email: 'test@ghostbond.com' } // Wait, email is simple text
      }
    });
    console.log('Create success:', response.id);
  } catch (error) {
    console.error('Create Error:', error.body || error);
  }
}

async function run() {
  await testQuery();
  await testCreate();
}
run();
