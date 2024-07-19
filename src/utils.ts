import * as path from 'path';
import { window, workspace } from 'vscode';
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

interface GoEnvVars {
  [key: string]: string;
}

const getGoEnvs = async (): Promise<GoEnvVars> => {
  const output = await execCommand('go env');

  const lines = output.trim().split('\n');
  const envVars: GoEnvVars = {};

  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      const key = parts[0];
      const value = parts[1];
      envVars[key] = value;
    }
  });

  return envVars;
}

export const resolveRootPackage = async (): Promise<string> => {
  const goEnvs = await getGoEnvs();

  if (goEnvs.GO111MODULE == 'on') {
    return resolveRootPackageByGoModFile(goEnvs.GOMOD);
  }

  if (fileInGOPATH(goEnvs.GOPATH)) {
    return resolveRootPackageWithGOPATH();
  }

  const pwd = window.activeTextEditor.document.fileName;
  const currentFolder = pwd.split(path.sep).slice(0, -1).join(path.sep);

  return getRootDir(currentFolder, 10)
    .then((rootDir) => {
      return resolveRootPackageByGoModFile(rootDir + '/go.mod');
    });
};


const resolveRootPackageByGoModFile = async (filePath: string): Promise<string> => {
  const content = await readFile(filePath)
  var name = '';

  const matches = moduleRegex.exec(content);
  if (matches !== null) {
    name = matches[1];
  }

  return name;
}

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


const projectRoot = workspace.workspaceFolders[0].uri.path;
export const execCommand = (command: string, cwd: string = projectRoot): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: cwd }, (error, stdout, stderr) => {
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