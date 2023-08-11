import fs from 'fs';
import path from 'path';

export type TraverseResult = {
  files: string[],
  dirs: string[]
}

export const traverseDirectory = async (dir: string, recursive: boolean): Promise<TraverseResult> => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile()).map(entry => path.join(dir, entry.name));
  const dirs = entries.filter(entry => entry.isDirectory()).map(entry => path.join(dir, entry.name));

  const subDirsFiles = recursive
    ? await Promise.all(dirs.map(subDir => traverseDirectory(subDir, recursive)))
    : [];

  return {
    files: [...files, ...subDirsFiles.flatMap(x => x.files)],
    dirs: [...dirs, ...subDirsFiles.flatMap(x => x.dirs)],
  };
};

export const isFileEmpty = (filePath: string): Promise<boolean> => fs.promises.stat(filePath).then(({ size }) => size === 0);