
import { SubtitleItem } from '../types';

/**
 * Formats seconds into SRT timestamp format: HH:MM:SS,mmm
 */
export const formatSrtTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const hours = Math.floor(seconds / 3600);
  const mins = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = (seconds % 1).toFixed(3).substring(2);
  
  return `${hours.toString().padStart(2, '0')}:${mins}:${secs},${ms}`;
};

/**
 * Converts an array of subtitle items to a valid SRT string
 */
export const generateSrtString = (subtitles: SubtitleItem[]): string => {
  return subtitles
    .map((item, index) => {
      const startTime = formatSrtTime(item.start);
      const endTime = formatSrtTime(item.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${item.text}\n`;
    })
    .join('\n');
};

/**
 * Triggers a file download in the browser
 */
export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
