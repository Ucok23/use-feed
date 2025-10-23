import express from 'express';
import cors from 'cors';
import axios from 'axios';
import parser from './parser';

import { query, run } from './db/index';
import { refetchFeeds, refetchSingleFeed } from './re-fetcher';

interface Feed {
  id: number;
  url: string;
  title: string;
}

interface Article {
  id: number;
  title: string;
  link: string;
  content: string;
  feedTitle: string;
}

interface RefetchLog {
  id: number;
  status: string;
  details: string;
  timestamp: string;
}

interface FeedItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
}

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.get('/feeds', (req, res) => {
  void (async () => {
    try {
      const rows = await query<Feed>('SELECT * FROM feeds');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching feeds');
    }
  })();
});

app.post('/feeds', (req, res) => {
  void (async () => {
    const { url } = req.body as { url: string };
    if (!url) {
      return res.status(400).send('URL is required');
    }

    try {
      const feed = await parser.parseURL(url);
      const newFeed = {
        url,
        title: feed.title || '',
      };

      await run('INSERT INTO feeds (url, title) VALUES ($1, $2) ON CONFLICT (url) DO NOTHING', [newFeed.url, newFeed.title]);
      const result = await query<{ id: number }>('SELECT id FROM feeds WHERE url = $1', [newFeed.url]) as { id: number }[];
      const feedRow = result[0];
      if (!feedRow) {
        return res.status(500).send('Could not create feed');
      }
      const newFeedId = feedRow.id;

      const newArticles = (feed.items as FeedItem[] || []).map((item: FeedItem) => ({
        title: item.title,
        link: item.link,
        content: item.contentSnippet,
        feedTitle: newFeed.title,
      }));

      for (const article of newArticles) {
        await run('INSERT INTO articles (title, link, content, feedTitle) VALUES ($1, $2, $3, $4) ON CONFLICT (link) DO NOTHING', [article.title, article.link, article.content, article.feedTitle]);
      }

      res.json({ newFeed: { id: newFeedId, ...newFeed }, newArticles });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching or parsing the URL');
    }
  })();
});

app.delete('/feeds/:url', (req, res) => {
  void (async () => {
    const { url } = req.params;
    try {
      const rows = await query<{ title: string }>('SELECT title FROM feeds WHERE url = $1', [url]);
      if (rows.length === 0) {
        return res.status(404).send('Feed not found');
      }
      const feedTitle = (rows[0] as { title: string }).title;
      await query('DELETE FROM articles WHERE feedTitle = $1', [feedTitle]);
      await query('DELETE FROM feeds WHERE url = $1', [url]);
      res.status(200).send('Feed deleted');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting feed');
    }
  })();
});

app.get('/feeds/:url/details', (req, res) => {
  void (async () => {
    const { url } = req.params;
    try {
      const rows = await query('SELECT title FROM feeds WHERE url = $1', [url]);
      if (rows.length === 0) {
        return res.status(404).send('Feed not found');
      }
      const feedTitle = (rows[0] as { title: string }).title;
      const result = await query<{ articleCount: number }>('SELECT COUNT(*) as "articleCount" FROM articles WHERE feedTitle = $1', [feedTitle]);
      res.json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error getting article count');
    }
  })();
});

app.get('/feeds/:url/history', (req, res) => {
  void (async () => {
    const { url } = req.params;
    try {
      const rows = await query<RefetchLog>("SELECT * FROM refetch_logs WHERE details LIKE $1 ORDER BY timestamp DESC", [`%${url}%`]);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching refetch history');
    }
  })();
});

app.post('/feeds/:url/refetch', (req, res) => {
  void (async () => {
    const { url } = req.params;
    try {
      const rows = await query<Feed>('SELECT * FROM feeds WHERE url = $1', [url]);
      if (rows.length === 0) {
        return res.status(404).send('Feed not found');
      }
      const feed = rows[0];
      await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['started', `Manually re-fetching feed: ${(feed as Feed).url}`]);
      const articlesAdded = await refetchSingleFeed(feed as Feed);
      await query("INSERT INTO refetch_logs (status, details) VALUES ($1, $2)", ['success', `Manually re-fetched feed: ${(feed as Feed).url}. ${articlesAdded} new articles added.`]);
      res.status(200).send(`Feed re-fetched successfully. ${articlesAdded} new articles added.`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error re-fetching feed');
    }
  })();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/proxy', (req, res) => {
  void (async () => {
    const url = req.query.url;
    if (typeof url !== 'string') {
      return res.status(400).send('URL is required');
    }

    try {
       
      const response = await axios.get(url, { responseType: 'text' });
      const feed = await parser.parseString(response.data as string);
      res.json(feed);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching or parsing the URL');
    }
  })();
});

app.get('/articles', (req, res) => {
  void (async () => {
    try {
      const rows = await query<Article>('SELECT * FROM articles');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching articles');
    }
  })();
});

app.post('/articles/snapshot', (req, res) => {
  void (async () => {
    const { articles: snapshotArticles } = req.body as { articles: Article[] };
    if (!snapshotArticles) {
      return res.status(400).send('Articles are required');
    }

    try {
      for (const article of snapshotArticles) {
        await query('INSERT INTO articles (title, link, content, feedTitle) VALUES ($1, $2, $3, $4) ON CONFLICT (link) DO NOTHING', [article.title, article.link, article.content, article.feedTitle]);
      }
      res.status(200).send('Snapshot received');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving snapshot');
    }
  })();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const refetchInterval = process.env.REFETCH_INTERVAL ? parseInt(process.env.REFETCH_INTERVAL, 10) : 300000;
const refetchMechanism = process.env.REFETCH_MECHANISM || 'interval';

if (refetchMechanism === 'cron') {
  void import('./scheduler');
} else {
  setInterval(() => {
    void refetchFeeds();
  }, refetchInterval);
}
