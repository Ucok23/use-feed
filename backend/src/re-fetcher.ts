import parser from './parser';
import { query } from './db/index';

interface Feed {
  id: number;
  url: string;
  title: string;
}

interface FeedItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
}

export const refetchSingleFeed = async (feed: Feed): Promise<number> => {
  let articlesAdded = 0;
  try {
    const parsedFeed = await parser.parseURL(feed.url);
    const newArticles = (parsedFeed.items || []).map((item: FeedItem) => ({
      title: item.title,
      link: item.link,
      content: item.contentSnippet,
      feedTitle: feed.title,
    }));

    for (const article of newArticles) {
      const rows = await query<{ id: number }>('SELECT id FROM articles WHERE link = $1', [article.link]);
      if (rows.length === 0) {
        await query('INSERT INTO articles (title, link, content, feedTitle) VALUES ($1, $2, $3, $4)', [article.title, article.link, article.content, article.feedTitle]);
        articlesAdded++;
      }
    }
  } catch (err) {
    console.error(`Error re-fetching feed: ${feed.url}`, err);
    await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['failure', `Error re-fetching feed: ${feed.url}. Error: ${(err as Error).message}`]);
    throw err;
  }
  return articlesAdded;
};

export const refetchFeeds = async () => {
  await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['started', 'Re-fetching all feeds...']);
  try {
    const feeds = await query<Feed>('SELECT * FROM feeds');
    let totalArticlesAdded = 0;
    for (const feed of feeds) {
      try {
        const articlesAdded = await refetchSingleFeed(feed);
        totalArticlesAdded += articlesAdded;
      } catch {
        // Error is already logged in refetchSingleFeed
      }
    }
    console.log('All feeds re-fetched.');
    await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['success', `All feeds re-fetched. ${totalArticlesAdded} new articles added.`]);
  } catch (err) {
    console.error('Error fetching feeds for re-fetching:', err);
    await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['failure', (err as Error).message]);
  }
};
