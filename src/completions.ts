import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs-extra'
import {getIncludeOrImportPathFromLine} from './util'


export class GLSLIncludeCompletionItemProvider implements vscode.CompletionItemProvider {

    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
		let line = document.lineAt(position.line).text
		let includeOrImportPath = getIncludeOrImportPathFromLine(line)

		if (includeOrImportPath) {
			let includeOrImportPathDir = includeOrImportPath.replace(/[^\\\/]+$/g, '')
			return this.getCompletionFromDir(document, includeOrImportPathDir)
		}
	}
	
	private async getCompletionFromDir(document: vscode.TextDocument, dir: string) {
		let absoluteDir = path.resolve(path.dirname(document.fileName), dir)
		if (!await fs.pathExists(absoluteDir) || !(await fs.stat(absoluteDir)).isDirectory()) {
			return null
		}

		let labels = await fs.readdir(absoluteDir)

		let promises = labels.map(async (label) => {
			let isDirectory = (await fs.stat(absoluteDir)).isDirectory()

			return {
				label,
				kind: isDirectory ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File,
			}
		})

		return await Promise.all(promises)
	}
}