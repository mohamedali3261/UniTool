/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { CompressionSettings } from '../types';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  try {
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    console.log('[FFmpeg] Load successful');
  } catch (error) {
    console.error('[FFmpeg] Load failed:', error);
    ffmpeg = null;
    throw error;
  }

  return ffmpeg;
};

export const compressAudio = async (
  file: File,
  settings: CompressionSettings,
  onProgress: (progress: number) => void,
  trim?: { start: number; end: number }
): Promise<Blob> => {
  const instance = await loadFFmpeg();
  const inputName = 'input_audio';
  const outputName = `output.${settings.format}`;

  instance.on('progress', ({ progress }) => {
    onProgress(Math.round(progress * 100));
  });

  await instance.writeFile(inputName, await fetchFile(file));

  let command = ['-i', inputName];

  // Add trim options if provided - using -ss and -t after input for better accuracy
  if (trim) {
    const duration = trim.end - trim.start;
    console.log('[FFmpeg] Trim settings:', {
      start: trim.start.toFixed(3),
      end: trim.end.toFixed(3),
      duration: duration.toFixed(3)
    });
    
    // Use accurate seeking for precise trimming
    if (trim.start > 0) {
      command = [...command, '-ss', trim.start.toFixed(3)];
    }
    if (duration > 0) {
      command = [...command, '-t', duration.toFixed(3)];
    }
  }

  // Bitrate and Codec
  if (settings.format === 'mp3') {
    command = [...command, '-c:a', 'libmp3lame', '-b:a', settings.bitrate];
  } else if (settings.format === 'aac') {
    command = [...command, '-c:a', 'aac', '-b:a', settings.bitrate];
  } else if (settings.format === 'opus') {
    command = [...command, '-c:a', 'libopus', '-b:a', settings.bitrate];
  } else {
    // Default to mp3 if format not recognized
    command = [...command, '-c:a', 'libmp3lame', '-b:a', settings.bitrate || '128k'];
  }

  // Channels
  if (settings.channels) {
    command = [...command, '-ac', settings.channels];
  }

  // Normalization and FX filters
  const filters = [];
  
  // Wind noise filter - removes low frequency wind rumble
  if (settings.windNoiseFilter) {
    filters.push('highpass=f=80', 'lowpass=f=18000');
  }
  
  // Hum remover - removes 50Hz/60Hz electrical hum and harmonics
  if (settings.humRemover) {
    filters.push('equalizer=f=50:t=q:w=1:g=-20', 'equalizer=f=60:t=q:w=1:g=-20', 'equalizer=f=100:t=q:w=1:g=-15', 'equalizer=f=120:t=q:w=1:g=-15');
  }
  
  // Noise reduction - advanced noise suppression
  if (settings.noiseReduction) {
    filters.push('highpass=f=200', 'anlmdn=s=10:p=0.002:r=0.002:m=15');
  }
  
  // Voice enhancement - boosts speech clarity (2-4 kHz)
  if (settings.voiceEnhance) {
    filters.push('equalizer=f=3000:t=h:w=2000:g=6', 'equalizer=f=200:t=h:w=100:g=-3');
  }
  
  // De-esser - reduces harsh sibilance
  if (settings.deEsser) {
    filters.push('equalizer=f=7000:t=q:w=2:g=-8', 'acompressor=threshold=0.5:ratio=4:attack=5:release=50:makeup=2');
  }
  
  // Dynamic range compressor - professional audio leveling
  if (settings.dynamicCompressor) {
    filters.push('acompressor=threshold=-20dB:ratio=3:attack=20:release=250:makeup=5');
  }
  
  // Normalization - consistent loudness
  if (settings.normalize) {
    filters.push('loudnorm');
  }
  
  // Bass boost - enhances low frequencies
  if (settings.bassBoost) {
    filters.push('bass=g=5:f=100:w=1.0');
  }

  if (filters.length > 0) {
    command = [...command, '-af', filters.join(',')];
  }

  // Ensure accurate seeking and avoid timestamp issues
  command = [...command, '-avoid_negative_ts', 'make_zero'];

  command.push(outputName);

  console.log('[FFmpeg] Command:', command.join(' '));

  try {
    const result = await instance.exec(command);
    if (result !== 0) {
      console.error('[FFmpeg] Command failed:', command.join(' '));
      throw new Error(`FFmpeg instance exited with code ${result}`);
    }
  } catch (err) {
    console.error('FFmpeg execution error:', err);
    console.error('Failed command:', command.join(' '));
    throw err;
  }

  const data = await instance.readFile(outputName);
  const blob = new Blob([data], { type: `audio/${settings.format}` });

  // Clean up
  await instance.deleteFile(inputName);
  await instance.deleteFile(outputName);

  return blob;
};

export const mergeAudios = async (
  blobs: Blob[],
  format: string,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const instance = await loadFFmpeg();
  const inputPaths: string[] = [];

  // Write all blobs to the virtual FS
  for (let i = 0; i < blobs.length; i++) {
    const name = `input_${i}`;
    await instance.writeFile(name, await fetchFile(blobs[i]));
    inputPaths.push(name);
  }

  const outputName = `merged_output.${format}`;
  
  // Use concat protocol for simple merging
  let filterComplex = '';
  for (let i = 0; i < blobs.length; i++) {
    filterComplex += `[${i}:a]`;
  }
  filterComplex += `concat=n=${blobs.length}:v=0:a=1[aout]`;

  const command = [];
  for (const path of inputPaths) {
    command.push('-i', path);
  }
  command.push('-filter_complex', filterComplex, '-map', '[aout]', outputName);

  try {
    const result = await instance.exec(command);
    if (result !== 0) throw new Error('Merge failed');
  } catch (err) {
    console.error('Merge error:', err);
    throw err;
  }

  const data = await instance.readFile(outputName);
  return new Blob([data], { type: `audio/${format}` });
};
