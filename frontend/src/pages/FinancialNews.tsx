import React, { useState, useEffect } from 'react';
import './FinancialNews.css';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  date: string;
  source: string;
}

const FinancialNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch from a news API
    // For this demo, we'll use mock data
    const mockNews: NewsItem[] = [
      {
        id: 1,
        title: 'Fed Signals Potential Rate Cut in Coming Months',
        summary: 'Federal Reserve officials indicated they could cut interest rates in the coming months if inflation continues to cool.',
        url: '#',
        date: '2025-04-01',
        source: 'Financial Times'
      },
      {
        id: 2,
        title: 'EUR/USD Reaches 3-Month High on Strong Eurozone Data',
        summary: 'The euro climbed against the dollar following better-than-expected economic data from the Eurozone.',
        url: '#',
        date: '2025-04-01',
        source: 'Reuters'
      },
      {
        id: 3,
        title: 'Oil Prices Drop Amid Concerns Over Global Demand',
        summary: 'Crude oil prices fell as investors worried about weakening demand in major economies.',
        url: '#',
        date: '2025-03-31',
        source: 'Bloomberg'
      },
      {
        id: 4,
        title: 'Bank of Japan Maintains Ultra-Low Interest Rates',
        summary: 'The Bank of Japan kept its ultra-low interest rates unchanged, bucking the global trend of monetary tightening.',
        url: '#',
        date: '2025-03-31',
        source: 'Nikkei'
      },
      {
        id: 5,
        title: 'Gold Hits New Record High Amid Geopolitical Tensions',
        summary: 'Gold prices reached a new all-time high as investors sought safe-haven assets amid rising geopolitical tensions.',
        url: '#',
        date: '2025-03-30',
        source: 'CNBC'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="news-loading">Loading news...</div>;
  }

  return (
    <div className="financial-news">
      {news.map((item) => (
        <div key={item.id} className="news-item">
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <div className="news-meta">
            <span>{item.source}</span>
            <span>{item.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialNews;
