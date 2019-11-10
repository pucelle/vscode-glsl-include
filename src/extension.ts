import * as vscode from 'vscode'
import {GLSLIncludeExtension} from './glsl-include'


export function activate(context: vscode.ExtensionContext): GLSLIncludeExtension {
	let extension = new GLSLIncludeExtension(context)

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(() => {
			extension.loadConfig()
		}),

		vscode.commands.registerCommand('extension.enableGLSLInclude', () => {
			extension.setEnabled(true)
		}),

		vscode.commands.registerCommand('extension.disableGLSLInclude', () => {
			extension.setEnabled(false)
		}),

		vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
			extension.onDocumentSave(document)
		})
	)

	return extension
}
