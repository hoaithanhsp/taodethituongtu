export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedContent {
  analysis: string;
  exam1: string;
  exam2: string;
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}