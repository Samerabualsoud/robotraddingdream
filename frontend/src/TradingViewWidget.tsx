import React, { useEffect, useRef } from 'react';
import './TradingViewWidget.css';

interface TradingViewWidgetProps {
  symbol: string;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = ()  => {
      if (window.TradingView && container.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `FX:${symbol}`,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: container.current.id,
        });
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container">
      <div id={`tradingview_${symbol}`} ref={container} className="tradingview-chart" />
    </div>
  );
};

export default TradingViewWidget;
