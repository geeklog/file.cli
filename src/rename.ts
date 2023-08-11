import fs from 'fs';
import path from 'path';
import util from 'util';
import { rmdir } from 'fs/promises';

// Convert fs.rename and fs.access to use Promises instead of callbacks
const rename = util.promisify(fs.rename);
const access = util.promisify(fs.access);

export async function safeRemove(fullPath: string) {
  // Try to remove the directory, if it's empty
  try {
    await rmdir(fullPath);
  } catch (error) {
    if (error.code !== 'ENOTEMPTY') {
      throw error;
    }
  }
}

export async function safeRename(oldPath: string, newPath: string): Promise<void> {
  if (oldPath === newPath)
    return;
  try {
    // Check if newPath already exists
    await access(newPath, fs.constants.F_OK);
    // If the previous line didn't throw an error, the newPath exists
    throw new Error(`Cannot rename: file at ${newPath} already exists.`);
  } catch (error) {
    // If the error is because the newPath doesn't exist (which is expected), continue to rename
    if (error.code === 'ENOENT') {
      await rename(oldPath, newPath);
    } else {
      // If the error is not ENOENT, re-throw the error
      throw error;
    }
  }
}

export interface RenameOptions {
  prefix?: string;
  suffix?: string;
  replace?: Array<[string, string]>;
  insert?: Array<[string, number]>;
  regex?: Array<[string, string]>;
  dryRun?: boolean;
  recursive?: boolean;
}

export function getNewName(file: string, options: RenameOptions): string {
  let newName = path.parse(file).name;  // Get the filename without the extension
  const ext = path.parse(file).ext;  // Get the file extension

  if (options.prefix) newName = options.prefix + newName;
  if (options.suffix) newName = newName + options.suffix;
  options.replace?.forEach(([oldText, newText]) => {
    newName = newName.replaceAll(oldText, newText);
  });
  options.insert?.forEach(([text, index]) => {
    newName = newName.substring(0, index) + text + newName.substring(index);
  });
  options.regex?.forEach(([regex, replacement]) => {
    newName = newName.replace(new RegExp(regex), replacement);
  });

  newName += ext;  // Add the extension back to the filename

  return newName;
}

/**
 * Function that renames a batch of files based on a provided rule.
 * 
 * The rule can contain special placeholders that will be replaced during the
 * renaming process. The placeholders are:
 *
 * - {F} is replaced with the original file name.
 * - {D} is replaced with a date string (ISO format).
 * - Prefix "p_{F}" adds "p_" before the original file name.
 * - Postfix "{F}_s" adds "_s" after the original file name.
 * - "{F,aaa:bbb,ccc:ddd}" replaces "aaa" with "bbb" and "ccc" with "ddd" in the original file name.
 * - Regex replace is possible with "{F,/a.*a/bb/}" where "a.*a" is the regex pattern and "bb" is the replacement.
 * - {0} for indices starting with 0. For example, "{0}_{F}" will rename ["a.txt", "b.txt"] to ["0_a.txt", "1_b.txt"].
 * - {1} for indices starting with 1. For example, "{1}_{F}" will rename ["a.txt", "b.txt"] to ["1_a.txt", "2_b.txt"].
 *
 * @param {string[]} files - An array of file names to be renamed.
 * @param {string} batchRule - The renaming rule with placeholders.
 * @returns {string[]} An array of new file names after applying the batch rule.
 */
export function batchNewName(files: string[], batchRule: string): string[] {
  let newNames: string[] = [];

  files.forEach((file, index) => {
    let newName = batchRule;

    let fileName = path.parse(file).name;
    let ext = path.parse(file).ext;

    let date = new Date().toISOString();

    // Replace {F} with the original file name
    newName = newName.replace(/\{F\}/g, fileName);

    // Replace {D} with a date string
    newName = newName.replace(/\{D\}/g, date);

    // Replace {0} with the current index (starts from 0)
    newName = newName.replace(/\{0\}/g, index.toString());

    // Replace {1} with the current index + 1 (starts from 1)
    newName = newName.replace(/\{1\}/g, (index + 1).toString());

    // Process regex replacements
    newName = newName.replace(/\{F,\/(.+?)\/(.+?)\/\}/g, function (_, p1, p2) {
      let [regex, replacement] = [p1, p2];
      return fileName.replace(new RegExp(regex, 'g'), replacement);
    });

    // Process replacements
    newName = newName.replace(/\{F,(.+?)\}/g, function (_, p1) {
      let replacements = p1.split(',');
      let replacedName = fileName;
      replacements.forEach(replacement => {
        let [oldText, newText] = replacement.split(':');
        replacedName = replacedName.replace(new RegExp(oldText, 'g'), newText);
      });
      return replacedName;
    });

    // Add the file extension back to the name
    newName = newName + ext;

    newNames.push(newName);
  });

  return newNames;
}
