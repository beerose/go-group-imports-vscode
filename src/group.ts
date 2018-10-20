
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

export const group = (imports: string[], rootPkg: string): string => {
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

  return `${importGroups.stdlib.join('\n')}\n\n${
    importGroups.thirdParty.join('\n')}\n\n${importGroups.own.join('\n')}`;
};
