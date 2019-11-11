import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs-extra'
import {getIncludeOrImportPathFromLine} from './util'


export class GLSLIncludeDefinitionProvider implements vscode.DefinitionProvider {

    async provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
		let line = document.lineAt(position.line).text
		let includeOrImportPath = getIncludeOrImportPathFromLine(line)

		if (includeOrImportPath) {
			return this.getLocationFromPath(document, includeOrImportPath)
		}
	}
	
	private async getLocationFromPath(document: vscode.TextDocument, filePath: string) {
		let absolutePath = path.resolve(path.dirname(document.fileName), filePath)
		if (!await fs.pathExists(absolutePath)) {
			return null
		}

		return {
			uri: vscode.Uri.file(absolutePath),
			range: new vscode.Range(0, 0, 0, 0),
		}
	}
}