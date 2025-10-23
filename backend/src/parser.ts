import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'GeminiFeedReader/1.0',
    'Accept': 'application/rss+xml,application/xml;q=0.9,text/xml;q=0.8,*/*;q=0.7',
  },
});

export default parser;
