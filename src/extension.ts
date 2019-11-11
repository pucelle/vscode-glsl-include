import * as vscode from 'vscode'
import {GLSLIncludeExtension} from './glsl-include'
import {GLSLIncludeCompletionItemProvider} from './completions'
import {generateGlobPatternFromExtensions} from './util'
import {GLSLIncludeDefinitionProvider} from './definition'


export function activate(context: vscode.ExtensionContext): GLSLIncludeExtension {
	let extension = new GLSLIncludeExtension(context)
	let glslExtensions = vscode.workspace.getConfiguration('GLSLInclude').get('extensions', []) as string[]

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
		}),

		vscode.languages.registerCompletionItemProvider(
			{scheme: 'file', pattern: generateGlobPatternFromExtensions(glslExtensions)},
			new GLSLIncludeCompletionItemProvider(),
			'/'
		),

		vscode.languages.registerDefinitionProvider(
			{scheme: 'file', pattern: generateGlobPatternFromExtensions(glslExtensions)},
			new GLSLIncludeDefinitionProvider()
		),
	)

	return extension
}
