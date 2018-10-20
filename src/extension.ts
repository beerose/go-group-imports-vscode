'use strict';
import {
  commands,
  ExtensionContext,
  Range,
  window,
} from 'vscode';
import { group } from './group';
import { multilineImportsGroupRegex, resolveRootPackage, getImportsRange } from './utils';

const goGroupImports = () => {
  const { activeTextEditor: editor, activeTextEditor: { document } } = window;
  const documentText = document.getText();

  if (document.languageId !== 'go') {
    window.showWarningMessage('Not a go file.');
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

  window.showInformationMessage('Imports have been grouped!');
};

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand('extension.goGroupImports', goGroupImports);

  context.subscriptions.push(disposable);
}

export function deactivate() {}


