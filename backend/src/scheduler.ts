import cron from 'node-cron';
import { refetchFeeds } from './re-fetcher';

// Schedule the job to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  void refetchFeeds();
});

console.log('Cron job scheduled to re-fetch feeds every 5 minutes.');
