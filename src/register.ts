import { Disposable, workspace } from 'vscode';

import { groupImportsOnSave } from './groupOnSave';

let saveRegistration : Disposable;

export function unregisterWillSaveTextDocument() {
  if (!saveRegistration) {
    return;
  }

  saveRegistration.dispose();
  saveRegistration = null;
}

export function registerWillSaveTextDocument() {
  if (saveRegistration) {
    return;
  }

  saveRegistration = workspace.onWillSaveTextDocument(groupImportsOnSave);
}

export function getOnSaveSetting() {
  return workspace.getConfiguration('groupImports').get('onSave');
}

export function updateSaveRegistration() {
    if (getOnSaveSetting()) {
        registerWillSaveTextDocument();
    } else {
        unregisterWillSaveTextDocument();
    }
}
