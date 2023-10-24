import { Disposable, workspace } from 'vscode'

import { groupImportsOnSave } from './groupOnSave'

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

  saveRegistration = workspace.onWillSaveTextDocument(groupImportsOnSave)
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
