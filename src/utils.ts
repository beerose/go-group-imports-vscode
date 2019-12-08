import * as path from 'path';
import { window, workspace, RelativePattern } from 'vscode';
import { resolve } from 'path';
const { readdir } = require('fs').promises;

export const multilineImportsGroupRegex = /import \(([^)]+)\)/;

const fileInGOPATH = (gopath: string | undefined) => {
  if (!gopath) {
    return false;
  }

  const pwd = window.activeTextEditor.document.fileName;
  const relative = path.relative(gopath, pwd);
  if (!pwd.includes(relative)) {
    false;
  }

  return true;
};

const resolveRootPackageWithGOPATH = () => {
  const pwd = window.activeTextEditor.document.fileName;
  const trimmedPwd = pwd.replace(path.join(process.env.GOPATH, 'src/', ''), '');
  const rootPkg = trimmedPwd
    .split(path.sep)
    .slice(0, 2)
    .join(path.sep);

  return rootPkg;
};

export const resolveRootPackage = () => {
  if (fileInGOPATH(process.env.GOPATH)) {
    return resolveRootPackageWithGOPATH();
  }

  const pwd = window.activeTextEditor.document.fileName;
  const currentFolder = pwd
    .split(path.sep)
    .slice(0, -1)
    .join(path.sep);

  return getRootDir(currentFolder, 5).then(rootDir => {
    return rootDir
      .split(path.sep)
      .slice(-1)
      .join(path.sep);
  });
};

const getRootDir = async (dir: string, depthLimit: number): Promise<string> => {
  const dirents = (await readdir(dir, { withFileTypes: true })) as {
    name: string;
    isDirectory: () => boolean;
  }[];
  const goModFile = dirents.find(dirent => dirent.name === 'go.mod');
  if (goModFile) {
    return dir;
  }

  const newDir =
    dir.split(path.sep).length > 1 &&
    dir
      .split(path.sep)
      .slice(0, -1)
      .join(path.sep);

  if (depthLimit > 0 && newDir) {
    return getRootDir(newDir, depthLimit - 1);
  }

  return '';
};

export const getImports = (documentText: string): string[] => {
  const importsMatch = documentText.match(multilineImportsGroupRegex);
  if (!importsMatch || importsMatch.length < 2) {
    return [];
  }

  return importsMatch[1].split('\n').filter(line => line.trim() != '');
};

export type ImportsRange = {
  start: number;
  end: number;
};

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
  };
};
