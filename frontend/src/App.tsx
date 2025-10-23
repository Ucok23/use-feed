import { useState, useEffect } from 'react';
import './App.css';
import FeedSettings from './FeedSettings';

interface Feed {
  url: string;
  title: string;
}

interface Article {
  title: string | undefined;
  link: string | undefined;
  content: string | undefined;
  feedTitle: string;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [managingFeed, setManagingFeed] = useState<Feed | null>(null);
  const [feedUrl, setFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFeed, setIsAddingFeed] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [feedsResponse, articlesResponse] = await Promise.all([
          fetch(`${apiUrl}/feeds`),
          fetch(`${apiUrl}/articles`),
        ]);
        const feeds = await feedsResponse.json();
        const articles = await articlesResponse.json();
        setFeeds(feeds);
        setArticles(articles);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const addFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedUrl || isAddingFeed) return;

    setIsAddingFeed(true);
    try {
      const response = await fetch(`${apiUrl}/feeds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: feedUrl }),
      });
      const { newFeed, newArticles } = await response.json();
      setFeeds([...feeds, newFeed]);
      setArticles([...articles, ...newArticles]);
      setSelectedFeed(newFeed);
      setFeedUrl('');
    } catch (error) {
      console.error('Error adding feed:', error);
    } finally {
      setIsAddingFeed(false);
    }
  };

  const selectFeed = (feed: Feed) => {
    setSelectedFeed(feed);
    setManagingFeed(null);
  };

  const displayedArticles = selectedFeed
    ? articles.filter(article => article.feedTitle === selectedFeed.title)
    : articles;

  const [loadedArticles, setLoadedArticles] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadedArticles(articles.map(a => a.link || ''));
    }, 100);
    return () => clearTimeout(timer);
  }, [articles]);

  const handleFeedDeleted = () => {
    if (managingFeed) {
      setFeeds(feeds.filter(feed => feed.url !== managingFeed.url));
      setArticles(articles.filter(article => article.feedTitle !== managingFeed.title));
      setManagingFeed(null);
      setSelectedFeed(null);
    }
  };

  if (managingFeed) {
    return (
      <FeedSettings
        feed={managingFeed}
        onBack={() => setManagingFeed(null)}
        onFeedDeleted={handleFeedDeleted}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="sidebar p-4">
        <h2 className="text-2xl font-bold mb-4">Feeds</h2>
        <form onSubmit={addFeed} className="mb-4">
          <input
            type="text"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="Enter RSS feed URL"
            className="w-full p-2 border rounded bg-gray-700 text-white"
            disabled={isAddingFeed}
          />
          <button
            type="submit"
            className="w-full p-2 mt-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            disabled={isAddingFeed}
          >
            {isAddingFeed ? 'Adding...' : 'Add Feed'}
          </button>
        </form>
        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          {feeds.length === 0 ? (
            <p className="px-4 text-gray-400">No feeds added yet.</p>
          ) : (
            <ul>
              {feeds.map((feed, index) => (
                <li
                  key={index}
                  className={`feed-list-item flex justify-between items-center ${selectedFeed?.url === feed.url ? 'selected' : ''}`}
                >
                  <span onClick={() => selectFeed(feed)} className="cursor-pointer flex-1">{feed.title}</span>
                  <button onClick={() => setManagingFeed(feed)} className="text-gray-400 hover:text-white">
                    Manage
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-4xl mx-auto p-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">{selectedFeed?.title || 'All Articles'}</h1>
          </div>
        </header>

        {/* Article list */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 py-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg">Loading...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg">No articles to display.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedArticles.map((article, index) => (
                  <div key={index} className={`article ${loadedArticles.includes(article.link || '') ? 'loaded' : ''}`}>
                    <h3 className="text-2xl font-bold mb-2">
                      <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {article.title}
                      </a>
                    </h3>
                    <p className="text-gray-700 mb-4">{article.content}</p>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                      Read More
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
