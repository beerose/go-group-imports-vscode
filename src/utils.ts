import * as path from 'path';
import { window } from 'vscode';
const { readdir, readFile } = require('fs').promises;
import { exec } from 'child_process';

export const multilineImportsGroupRegex = /import \(([^)]+)\)/;
export const moduleRegex = /module (.*?)\n/;

const fileInGOPATH = (gopath: string | undefined) => {
  if (!gopath) {
    return false;
  }

  const pwd = window.activeTextEditor.document.fileName;
  const relative = path.relative(gopath, pwd);
  const include = pwd.includes(relative);

  if (!include) {
    return false;
  }

  return true;
};

const resolveRootPackageWithGOPATH = () => {
  const pwd = window.activeTextEditor.document.fileName;
  const trimmedPwd = pwd.replace(path.join(process.env.GOPATH, 'src/', ''), '');
  const rootPkg = trimmedPwd.split(path.sep).slice(0, 2).join(path.sep);

  return rootPkg;
};

export const resolveRootPackage = () => {
  if (fileInGOPATH(process.env.GOPATH)) {
    return resolveRootPackageWithGOPATH();
  }

  const pwd = window.activeTextEditor.document.fileName;
  const currentFolder = pwd.split(path.sep).slice(0, -1).join(path.sep);

  return getRootDir(currentFolder, 10)
    .then((rootDir) => {
      return readFile(rootDir + '/go.mod');
    })
    .then((data) => {
      var name = '';

      const matches = moduleRegex.exec(data);
      if (matches !== null) {
        name = matches[1];
      }

      return name;
    });
};

const getRootDir = async (dir: string, depthLimit: number): Promise<string> => {
  const dirents = (await readdir(dir, { withFileTypes: true })) as {
    name: string;
    isDirectory: () => boolean;
  }[];
  const goModFile = dirents.find((dirent) => dirent.name === 'go.mod');
  if (goModFile) {
    return dir;
  }

  const newDir =
    dir.split(path.sep).length > 1 &&
    dir.split(path.sep).slice(0, -1).join(path.sep);

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

  return importsMatch[1].split('\n').filter((line) => line.trim() != '');
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


export const execCommand = (workspacePath: string, command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: workspacePath }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Error executing command: ${error.message}`));
      } else if (stderr) {
        reject(new Error(`Stderr output: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
};