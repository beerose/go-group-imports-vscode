import * as path from 'path';
import {
  window,
} from 'vscode';

export const multilineImportsGroupRegex = /import \(([^)]+)\)/;

export const resolveRootPackage = () => {
  const gopath = process.env.GOPATH;
  if (gopath === '') {
    window.showErrorMessage('No gopath configured.');
    return '';
  }

  const pwd = window.activeTextEditor.document.fileName;
  if (!pwd.includes(gopath)) {
    window.showErrorMessage('File is not in gopath.');
    return '';
  }

  const trimmedPwd = pwd.replace(path.join(gopath, 'src/', ''), '');
  const rootPkg = trimmedPwd.split(path.sep).slice(0, 2).join(path.sep);

  return rootPkg;
};

export const getImports = (documentText: string): string[] => {
  const importsMatch = documentText.match(multilineImportsGroupRegex);
  if (!importsMatch || importsMatch.length < 2) {
    return [];
  }

  return importsMatch[1]
    .split("\n")
    .filter(line => line.trim() != "");
};

export type ImportsRange = {
  start: number,
  end: number,
}

export const getImportsRange = (documentText: string): ImportsRange => {
  let start = 1; // lines in vs code are numereted from 1
  for (var line of documentText.split('\n')) {
    if (line.includes('import (')) {
      break;
    }
    start++;
  }

  let end = start;
  for (var line of documentText.split('\n').slice(start)) {
    if (line.includes(')')) {
      break;
    }
    end++;
  }

  return {
    end,
    start,
  }
}
