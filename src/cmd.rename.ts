import { zip } from 'lodash';
import path from 'path';
import { sortFiles, SortOptions } from './cmd.sort';
import { traverseDirectory } from "./directory";
import { batchNewName, getNewName, RenameOptions, safeRename } from './rename';

export async function commandRename(dir: string, options: RenameOptions) {
  const { files } = await traverseDirectory(dir, options.recursive);
  await Promise.all(files.map(file => {
    const newPath = path.join(path.dirname(file), getNewName(file, options));
    if (file === newPath)
      return Promise.resolve();
    if (options.dryRun) {
      console.log(`Would rename: ${file} to ${newPath}`);
      return Promise.resolve();
    } else {
      return safeRename(file, newPath)
        .then(() => console.log(`Renamed: ${file} to ${newPath}`))
        .catch(err => console.error(`Error processing file ${file}: ${err}`));
    }
  }));
}

export async function commandRenameWithRule(batchRule: string, dir: string, options: SortOptions & RenameOptions) {
  const { files } = await traverseDirectory(dir, options.recursive);
  const filesWithStats = await sortFiles(files, options);
  const oldPaths = filesWithStats.map(f => f.file);
  const newNames = batchNewName(oldPaths, batchRule);
  const pathsMapping = zip(oldPaths, newNames);
  for (let [oldPath, newName] of pathsMapping) {
    let newPath = path.join(path.dirname(oldPath), newName);
    if (oldPath === newPath)
      continue;
    if (options.dryRun) {
      console.log(`Would rename: ${oldPath} to ${newPath}`);
    } else {
      safeRename(oldPath, newPath)
        .then(() => console.log(`Renamed: ${oldPath} to ${newPath}`))
        .catch(err => console.error(`Error processing file ${oldPath}: ${err}`));
    }
  }
}