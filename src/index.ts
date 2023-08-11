#!/usr/bin/env node

import { Command } from 'commander';
import {commandSort} from './cmd.sort';
import {commandRename, commandRenameWithRule} from './cmd.rename';
import {commandRemoveEmptyDirs, commandRemoveEmptyFile} from './cmd.remove';
import { commandFlatten } from './cmd.flatten';

const collect = (value, previous) => previous.concat([value.split(',')]);

const program = new Command();

program
  .version('0.0.1')
  .description('A CLI tool for manipulating files and directories');
program
  .command('remove-empty-file <dir>')
  .description('Remove all empty files in a directory')
  .option('-n, --dry-run', 'Simulate the operation without making any changes')
  .option('-r, --recursive', 'Remove empty files in subdirectories recursively')
  .action(commandRemoveEmptyFile);
program
  .command('remove-empty-dirs <dir>')
  .description('Remove all empty directories in a directory')
  .option('-n, --dry-run', 'Simulate the operation without making any changes')
  .option('-r, --recursive', 'Remove empty directories recursively')
  .action(commandRemoveEmptyDirs);
program
  .command('rename <dir>')
  .description('Batch rename files in a directory')
  .option('-p, --prefix <prefix>', 'Add a prefix to filenames')
  .option('-s, --suffix <suffix>', 'Add a suffix to filenames')
  .option('-c, --replace <old,new>', 'Replace occurrences of "old" text with "new" text in filenames', collect, [])
  .option('-i, --insert <text,index>', 'Insert "text" at "index" position in filenames', collect, [])
  .option('-x, --regex <regex,replacement>', 'Use a regular expression to rename files', collect, [])
  .option('-n, --dry-run', 'Simulate the operation without making any changes')
  .option('-r, --recursive', 'Rename files in subdirectories recursively')
  .action(commandRename);

const RULE_DESC = `
    The rule can contain special placeholders that will be replaced during the renaming process.
    
    The placeholders are:
    
    - {F} is replaced with the original file name.
    - {D} is replaced with a date string (ISO format).
    - Prefix "p_{F}" adds "p_" before the original file name.
    - Postfix "{F}_s" adds "_s" after the original file name.
    - "{F,aaa:bbb,ccc:ddd}" replaces "aaa" with "bbb" and "ccc" with "ddd" in the original file name.
    - Regex replace is possible with "{F,/a.*a/bb/}" where "a.*a" is the regex pattern and "bb" is the replacement.
    - {0} for indices starting with 0. For example, "{0}_{F}" will rename ["a.txt", "b.txt"] to ["0_a.txt", "1_b.txt"].
    - {1} for indices starting with 1. For example, "{1}_{F}" will rename ["a.txt", "b.txt"] to ["1_a.txt", "2_b.txt"].
`;

program
  .command('rename-with <rule> <dir>')
  .description(`Batch rename files in a directory with custom rules.${RULE_DESC}`)
  .option('-n, --dry-run', 'Simulate the operation without making any changes')
  .option('-r, --recursive', 'Rename files in subdirectories recursively')
  .option('-s, --size', 'Sort by file size')
  .option('-c, --created', 'Sort by file creation date')
  .option('-m, --modified', 'Sort by file modified date')
  .option('-j, --json', 'Output in JSON format')
  .action(commandRenameWithRule);
program
  .command('sort <dir>')
  .description('Sort files in a directory')
  .option('-s, --size', 'Sort by file size')
  .option('-c, --created', 'Sort by file creation date')
  .option('-m, --modified', 'Sort by file modified date')
  .option('-j, --json', 'Output in JSON format')
  .action(commandSort);
program
  .command('flatten <dir>')
  .description('Flatten the directory structure')
  .option('-n, --dry-run', 'Simulate the operation without making any changes')
  .option('-r, --recursive', 'Flatten directories recursively')
  .action((dir, options) => commandFlatten(dir, dir, options));

program.parse(process.argv);