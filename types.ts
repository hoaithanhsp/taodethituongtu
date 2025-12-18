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

export type DiagramMode = 'standard' | 'detailed';
export type SolutionMode = 'concise' | 'detailed' | 'very_detailed';

export interface GenerationOptions {
  diagramMode: DiagramMode;
  solutionMode: SolutionMode;
}
