import {
  Range,
  window,
} from 'vscode';
import { multilineImportsGroupRegex, resolveRootPackage, getImportsRange, getImports } from './utils';

export const goGroupImports = () => {
  const { activeTextEditor: editor, activeTextEditor: { document } } = window;
  const documentText = document.getText();

  if (document.languageId !== 'go') return;

  const rootPkg = resolveRootPackage();
  if (rootPkg === '') return;

  const imports = getImports(documentText);
  if (!imports.length) return;

  const groupedList = group(imports, rootPkg);

  const importsRange = getImportsRange(documentText);
  editor.edit(edit => {
    edit.replace(
        new Range(importsRange.start, 0, importsRange.end - 1, Number.MAX_VALUE),
        importGroupsToString(groupedList))
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

export const group = (imports: string[], rootPkg: string): ImportGroups => {
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

  return importGroups;
};

const importGroupsToString = (importGroups: ImportGroups): string =>
  Object.keys(importGroups)
    .filter(key => importGroups[key].length)
    .map(key => importGroups[key].join('\n'))
    .join('\n\n');

