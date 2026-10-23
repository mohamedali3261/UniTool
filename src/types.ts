/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  format: 'mp3' | 'aac' | 'opus' | 'wav' | 'ogg';
  bitrate: string;
  sampleRate?: string;
  channels?: '1' | '2';
  normalize: boolean;
  bassBoost: boolean;
  noiseReduction: boolean;
  deEsser: boolean;
  voiceEnhance: boolean;
  humRemover: boolean;
  dynamicCompressor: boolean;
  windNoiseFilter: boolean;
}

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'completed' | 'error';

export interface AudioFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  processedSize?: number;
  status: ProcessingStatus;
  progress: number;
  errorMessage?: string;
  resultBlob?: Blob;
  previewUrl?: string; // For the audio player
  startTime?: number; // In seconds
  endTime?: number;   // In seconds
  duration?: number;  // Total duration in seconds
}
