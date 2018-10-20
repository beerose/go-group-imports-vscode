'use strict';
import {
  commands,
  ExtensionContext,
  workspace,
} from 'vscode';
import { goGroupImports } from './group';
import { updateSaveRegistration } from './register';

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand('extension.goGroupImports', goGroupImports);
  context.subscriptions.push(disposable);

  updateSaveRegistration();
  workspace.onDidChangeConfiguration(updateSaveRegistration);
}

export function deactivate() {}


