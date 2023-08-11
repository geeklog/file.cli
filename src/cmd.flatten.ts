import fs from 'fs';
import util from 'util';
import path from 'path';
import { safeRemove, safeRename } from './rename';

// Convert fs functions to use Promises instead of callbacks
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

export async function commandFlatten(dir: string, baseDir: string = dir, options) {
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      // Recursively flatten subdirectories first
      await commandFlatten(fullPath, baseDir, options);

      // Now, handle files in this directory
      const subEntries = await readdir(fullPath);
      for (const subEntry of subEntries) {
        const fullSubEntryPath = path.join(fullPath, subEntry);
        const newFullPath = path.join(baseDir, subEntry);

        const subEntryStats = await stat(fullSubEntryPath);
        if (subEntryStats.isFile()) {
          if (!options.dryRun) {
            await safeRename(fullSubEntryPath, newFullPath);
          } else {
            console.log(`[Dry Run] Would move: ${fullSubEntryPath} -> ${newFullPath}`);
          }
        }
      }

      if (!options.dryRun) {
        safeRemove(fullPath);
      } else {
        console.log(`[Dry Run] Would remove directory: ${fullPath}`);
      }
    }
  }
}
