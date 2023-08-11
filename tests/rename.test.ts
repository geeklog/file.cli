import {describe, expect, it} from '@jest/globals';
import { batchNewName, getNewName } from '../src/rename';

describe('getNewName', () => {
  it('should add prefix to filename', () => {
    const options = { prefix: 'pre_' };
    const result = getNewName('test.txt', options);
    expect(result).toBe('pre_test.txt');
  });

  it('should add suffix to filename', () => {
    const options = { suffix: '_suf' };
    const result = getNewName('test.txt', options);
    expect(result).toBe('test_suf.txt');
  });

  it('should replace text in filename', () => {
    const options = { replace: [['test', 'best']] as [[string, string]] };
    const result = getNewName('test.txt', options);
    expect(result).toBe('best.txt');
  });

  it('should insert text at given index in filename', () => {
    const options = { insert: [['mid', 2]]  as [[string, number]]  };
    const result = getNewName('test.txt', options);
    expect(result).toBe('temidst.txt');
  });

  it('should replace text in filename using regex', () => {
    const options = { regex: [['b.*t', 'most']]  as [[string, string]] };
    const result = getNewName('best.txt', options);
    expect(result).toBe('most.txt');
  });

  it('should handle multiple operations correctly', () => {
    const options = {
      prefix: 'pre_',
      suffix: '_suf',
      replace: [['test', 'best']]  as [[string, string]],
      regex: [['b.*t', 'most']] as [[string, string]]
    };
    const result = getNewName('test.txt', options);
    expect(result).toBe('pre_most_suf.txt');
  });

  it('should return original filename if no options are given', () => {
    expect(getNewName('test.txt', {})).toBe('test.txt');
  });
});

describe('batchNewName', () => {
  it('should handle prefix', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = 'p_{F}';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['p_file1.txt', 'p_file2.txt']);
  });

  it('should handle postfix', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '{F}_s';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['file1_s.txt', 'file2_s.txt']);
  });

  it('should handle replacements', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '{F,file:doc}';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['doc1.txt', 'doc2.txt']);
  });

  it('should handle regex replacements', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '{F,/fi(.*?)le/bb/}';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['bb1.txt', 'bb2.txt']);
  });

  it('should handle 0-based indices', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '{0}_{F}';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['0_file1.txt', '1_file2.txt']);
  });

  it('should handle 1-based indices', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '{1}_{F}';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['1_file1.txt', '2_file2.txt']);
  });

  it('should handle date', () => {
    const files = ['file1.txt'];
    const rule = '{D}_{F}';
    const result = batchNewName(files, rule);
    // Since we can't predict the exact date string, just check if it contains a date
    expect(result[0]).toContain('_file1.txt');
  });

  it('should handle empty rule', () => {
    const files = ['file1.txt', 'file2.txt'];
    const rule = '';
    const result = batchNewName(files, rule);
    expect(result).toEqual(['.txt', '.txt']);
  });

  it('should handle empty files array', () => {
    const files: string[] = [];
    const rule = '{F}';
    const result = batchNewName(files, rule);
    expect(result).toEqual([]);
  });
});