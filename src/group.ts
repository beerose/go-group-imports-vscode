import { Range, window, WorkspaceEdit } from 'vscode'
import { resolveRootPackage, getImportsRange, getImports, execCommand } from './utils'
import { getIncludeOrgGroupSettings } from './register'

export const goGroupImports = async () => {
  const {
    activeTextEditor: editor,
    activeTextEditor: { document },
  } = window
  const documentText = document.getText()

  if (document.languageId !== 'go') return

  const rootPkg = await resolveRootPackage()
  if (rootPkg === '') {
    window.showErrorMessage(
      'Failed to resolve root project directory. No GOPATH variable or go.mod file found.'
    )
    return
  }
  // TODO show error

  const output = await execCommand('go list -m');
  const modules = output.split('\n').filter(line => line.trim() !== '');

  const imports = getImports(documentText)

  if (!imports.length) return

  const groupedList = group(imports, rootPkg, modules, getIncludeOrgGroupSettings())

  const importsRange = getImportsRange(documentText)


  const range = new Range(
    importsRange.start,
    0,
    importsRange.end - 1,
    Number.MAX_VALUE
  )
  const newImports = importGroupsToString(groupedList)

  const edit = TextEdit.replace(range, newImports);

  return [edit]
}

import * as vscode from 'vscode';
import { TextEdit, Position } from 'vscode';

// Helper function to modify a specific line
async function modifyLineContent(document: vscode.TextDocument, lineNumber: number, newText: string): Promise<TextEdit[]> {
  const line = document.lineAt(lineNumber);
  const range = new Range(new Position(lineNumber, 0), new Position(lineNumber, line.text.length));
  const edit = TextEdit.replace(range, newText);
  return [edit];
}

type ImportGroups = {
  stdlib: string[]
  thirdParty: string[]
  organization: string[]
  workspace: string[]
  own: string[]
}

const isStdlibImport = (imp: string): boolean => {
  return !imp.includes('.')
}

const isImportFrom = (imp: string, root: string): boolean => {
  return imp.includes(root)
}


export const group = (
  imports: string[],
  rootPkg: string,
  workspacePkgs: string[],
  organizationPkg: string
): ImportGroups => {
  const importGroups = <ImportGroups>{
    stdlib: [],
    thirdParty: [],
    organization: [],
    workspace: [],
    own: [],
  }

  workspacePkgs = workspacePkgs.filter(pkg => pkg !== rootPkg);
  imports.forEach((imp) => {
    if (isImportFrom(imp, rootPkg)) {
      importGroups.own.push(imp)
    } else if (workspacePkgs.some(pkg => isImportFrom(imp, pkg))) {
      importGroups.workspace.push(imp)
    } else if (isStdlibImport(imp)) {
      importGroups.stdlib.push(imp)
    } else if (organizationPkg != '' && isImportFrom(imp, organizationPkg)) {
      importGroups.organization.push(imp)
    } else {
      importGroups.thirdParty.push(imp)
    }
  })

  return importGroups
}

const importGroupsToString = (importGroups: ImportGroups): string =>
  Object.keys(importGroups)
    .filter((key) => importGroups[key].length)
    .map((key) => importGroups[key].join('\n'))
    .join('\n\n')
