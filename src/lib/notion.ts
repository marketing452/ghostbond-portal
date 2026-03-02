import { Client } from "@notionhq/client";

export function getNotionClient(): Client {
  if (!process.env.NOTION_API_KEY) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      // Return a dummy client during Vercel build phase if required to pass compilation
      return new Client({ auth: 'dummy_key_for_build' });
    }
    throw new Error("Missing NOTION_API_KEY environment variable");
  }

  return new Client({
    auth: process.env.NOTION_API_KEY,
  });
}

export function getDatabaseId(): string {
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;
  if (!DATABASE_ID) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      return 'dummy_db_id_for_build';
    }
    throw new Error("Missing NOTION_DATABASE_ID environment variable");
  }
  return DATABASE_ID;
}
