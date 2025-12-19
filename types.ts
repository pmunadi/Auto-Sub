
export interface SubtitleItem {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TranscriptionResponse {
  subtitles: SubtitleItem[];
}

export enum Language {
  INDONESIAN = 'id',
  ENGLISH = 'en'
}
