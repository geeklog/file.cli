import fs from 'fs';
import { traverseDirectory } from './directory';

export type SortOptions = {
  size?: boolean;
  created?: boolean;
  modified?: boolean;
  json?: boolean;
};

export async function sortFiles(files: string[], options: SortOptions): Promise<{ file: string, stats: fs.Stats }[]> {
  const statsPromises = files.map(file => fs.promises.stat(file).catch(() => null));
  const stats = await Promise.all(statsPromises);
  const filesWithStats = files.map((file, i) => ({ file, stats: stats[i] })).filter(item => item.stats);

  if (options.size) {
    filesWithStats.sort((a, b) => a.stats.size - b.stats.size);
  } else if (options.created) {
    filesWithStats.sort((a, b) => a.stats.birthtimeMs - b.stats.birthtimeMs);
  } else if (options.modified) {
    filesWithStats.sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs);
  }

  return filesWithStats;
}

export function formatOutput(filesWithStats: { file: string, stats: fs.Stats }[], options: SortOptions): string {
  if (options.json) {
    const output = filesWithStats.map(({ file, stats }) => ({
      path: file,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    }));
    return JSON.stringify(output, null, 2);
  } else {
    return filesWithStats.map(({ file, stats }) => 
      `${file} (Size: ${stats.size} bytes, Created: ${new Date(stats.birthtime).toLocaleString()}, Modified: ${new Date(stats.mtime).toLocaleString()})`
    ).join('');
  }
}

export async function commandSort(dir: string, options: SortOptions) {
  const { files } = await traverseDirectory(dir, false);
  const filesWithStats = await sortFiles(files, options);
  const output = formatOutput(filesWithStats, options);
  console.log(output);
}
