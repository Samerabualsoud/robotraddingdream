/// <reference types="react-scripts" />

interface Window {
  TradingView?: {
    widget: (config: any) => any;
  }
}
