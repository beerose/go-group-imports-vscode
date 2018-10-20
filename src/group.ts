import {
  Range,
  window,
} from 'vscode';
import { multilineImportsGroupRegex, resolveRootPackage, getImportsRange } from './utils';
import { groupImportsOnSave } from './groupOnSave';

export const goGroupImports = () => {
  const { activeTextEditor: editor, activeTextEditor: { document } } = window;
  const documentText = document.getText();

  if (document.languageId !== 'go') {
    window.showWarningMessage('Not a go file.');
    return;
  }

  const rootPkg = resolveRootPackage();
  if (rootPkg === '') return;

  const importsMatch = documentText.match(multilineImportsGroupRegex);
  if (importsMatch.length < 2) {
    window.showErrorMessage('Cannot extract imports from file.');
    return;
  }
  const imports = importsMatch[1]
    .split("\n")
    .filter(line => line != "");

  const grouped = group(imports, rootPkg);

  const importsRange = getImportsRange(documentText);
  editor.edit(edit => {
    edit.replace(
        new Range(importsRange.start, 0, importsRange.end - 1, Number.MAX_VALUE),
        grouped)
  });

  document.save();
};

type ImportGroups = {
  stdlib: string[],
  thirdParty: string[],
  own: string[],
};

const isStdlibImport = (imp: string): boolean => {
  return !imp.includes('.');
};

const isOwnImport = (imp: string, root: string): boolean => {
  return imp.includes(root);
};

const group = (imports: string[], rootPkg: string): string => {
  const importGroups = <ImportGroups>{
    stdlib: [],
    thirdParty: [],
    own: [],
  };

  imports.forEach((imp) => {
    if (isOwnImport(imp, rootPkg)) {
      importGroups.own.push(imp);
    } else if (isStdlibImport(imp)) {
      importGroups.stdlib.push(imp);
    } else {
      importGroups.thirdParty.push(imp);
    }
  });

  return Object.keys(importGroups)
    .filter(key => importGroups[key].length)
    .map(key => importGroups[key].join('\n'))
    .join('\n\n');
};
