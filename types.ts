
export interface GenerationResult {
  code: string;
  explanation?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type TabType = 'preview' | 'code' | 'deploy' | 'verify';
