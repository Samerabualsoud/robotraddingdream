/**
 * Type definitions for TradingView Widget API
 */

interface TradingViewWidgetConfig {
  autosize?: boolean;
  symbol?: string;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  width?: number | string;
  height?: number | string;
  hide_top_toolbar?: boolean;
  hide_side_toolbar?: boolean;
  withdateranges?: boolean;
  save_image?: boolean;
  studies?: string[];
  show_popup_button?: boolean;
  popup_width?: number | string;
  popup_height?: number | string;
}

interface TradingViewStatic {
  widget: (config: TradingViewWidgetConfig) => TradingViewWidget;
}

interface TradingViewWidget {
  iframe: HTMLIFrameElement;
  onChartReady: (callback: () => void) => void;
  setSymbol: (symbol: string, interval?: string, callback?: () => void) => void;
  chart: () => TradingViewChart;
  remove: () => void;
  resize: (width: number, height: number) => void;
}

interface TradingViewChart {
  executeActionById: (actionId: string) => void;
  createStudy: (name: string, forceOverlay: boolean, overrides: object, inputs: object) => number;
  removeAllStudies: () => void;
  getAllStudies: () => object[];
  setResolution: (resolution: string, callback: () => void) => void;
  resetData: () => void;
  executeScript: (script: string) => void;
  refreshMarks: () => void;
  clearMarks: () => void;
}

interface Window {
  TradingView?: TradingViewStatic;
}
