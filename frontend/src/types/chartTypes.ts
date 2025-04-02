/**
 * Type definitions for Chart.js integration
 */

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  scales?: {
    x?: {
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
      };
    };
    y?: {
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
        callback?: (value: number) => string;
      };
      beginAtZero?: boolean;
    };
  };
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        color?: string;
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'point' | 'nearest' | 'dataset';
      intersect?: boolean;
      callbacks?: {
        label?: (context: any) => string;
      };
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
  elements?: {
    line?: {
      tension?: number;
    };
    point?: {
      radius?: number;
      hoverRadius?: number;
    };
  };
}

export type ChartType = 'line' | 'bar' | 'radar' | 'pie' | 'doughnut' | 'polarArea' | 'bubble' | 'scatter';
