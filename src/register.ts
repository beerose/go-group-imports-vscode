import { Disposable, workspace, TextDocumentWillSaveEvent } from 'vscode'
import { goGroupImports } from './group';

let saveRegistration: Disposable

const unregisterWillSaveTextDocument = () => {
  if (!saveRegistration) {
    return
  }

  saveRegistration.dispose()
  saveRegistration = null
}

const registerWillSaveTextDocument = () => {
  if (saveRegistration) {
    return
  }

  saveRegistration = workspace.onWillSaveTextDocument(async (e: TextDocumentWillSaveEvent) => {
    const document = e.document;
    if (document.languageId === 'go') {
      const edits = goGroupImports()
      e.waitUntil(edits);
    }
  })
}

export const getOnSaveSetting = () => {
  return workspace.getConfiguration('groupImports').get('onSave')
}

export const getIncludeOrgGroupSettings = () => {
  return (
    workspace.getConfiguration('groupImports').get<string>('includeOrgGroup') ||
    ''
  )
}

export const updateSaveRegistration = () =>
  getOnSaveSetting()
    ? registerWillSaveTextDocument()
    : unregisterWillSaveTextDocument()
