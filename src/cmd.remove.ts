import fs from 'fs';
import path from 'path';
import { isFileEmpty, traverseDirectory } from "./directory";

export async function commandRemoveEmptyFile(dir, options) {
  const { files } = await traverseDirectory(dir, options.recursive);
  await Promise.all(files.map(file =>
    isFileEmpty(file).then(empty =>
      empty && (options.dryRun
        ? console.log(`Empty file found: ${file}`)
        : fs.promises.unlink(file).then(() => console.log(`Removed empty file: ${file}`))
      )
    ).catch(err => console.error(`Error processing file ${file}: ${err}`))
  ));
}

export const commandRemoveEmptyDirs = (dir: string, options: any) => {
  // Check if the directory exists
  if (!fs.existsSync(dir)) {
    console.error(`Directory ${dir} does not exist`);
    return;
  }

  // Recursive function to remove empty directories
  const removeEmptyDirsRecursive = (dir: string) => {
    // Read all items in the directory
    const items = fs.readdirSync(dir);

    // Iterate over each item
    items.forEach(item => {
      const fullPath = path.join(dir, item);

      // If the item is a directory
      if (fs.statSync(fullPath).isDirectory()) {
        // Recursively call this function
        removeEmptyDirsRecursive(fullPath);
      }
    });

    // After cleaning sub-directories, re-check if the directory is empty
    if (fs.readdirSync(dir).length === 0) {
      // If dry-run option is enabled, just log the operation
      if (options.dryRun) {
        console.log(`[Dry Run] Would remove empty directory: ${dir}`);
      } else {
        // Otherwise, remove the directory
        fs.rmdirSync(dir);
        console.log(`Removed empty directory: ${dir}`);
      }
    }
  };

  if (options.recursive) {
    removeEmptyDirsRecursive(dir);
  } else {
    // If not recursive, just remove the directory if it's empty
    if (fs.readdirSync(dir).length === 0) {
      // If dry-run option is enabled, just log the operation
      if (options.dryRun) {
        console.log(`[Dry Run] Would remove empty directory: ${dir}`);
      } else {
        // Otherwise, remove the directory
        fs.rmdirSync(dir);
        console.log(`Removed empty directory: ${dir}`);
      }
    }
  }
};