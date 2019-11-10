import * as path from 'path'
import * as vscode from 'vscode'
import * as minimatch from 'minimatch'
import * as fs from 'fs-extra'
import {GLSLCompiler} from './compiler'
import {generateGlobPatternFromPatterns} from './util'


export interface Configuration {
	extensions: string[]
	runningStatusMessage: string
	finishStatusMessage: string
	statusMessageTimeout: number
	matchGlob: string[]
	notMatchGlob: string[]
	destPath: string
	srcDirname: string
	destDirPathRelativeToSrc: string
}


export class GLSLIncludeExtension {

	private context: vscode.ExtensionContext
	private config!: vscode.WorkspaceConfiguration
	private channel: vscode.OutputChannel = vscode.window.createOutputChannel('GLSL Include')
	private matchGlob: minimatch.IMinimatch | null = null
	private notMatchGlob: minimatch.IMinimatch | null = null

	constructor(context: vscode.ExtensionContext) {
		this.context = context
		this.loadConfig()
		this.showEnablingChannelMessage()

		context.subscriptions.push(this.channel)
	}

	loadConfig() {
		this.config = vscode.workspace.getConfiguration('GLSLInclude')

		let matchGlob = this.config.get('matchGlob', []) as string[]
		let notMatchGlob = this.config.get('notMatchGlob', []) as string[]

		if (matchGlob.length > 0) {
			this.matchGlob = new minimatch.Minimatch(generateGlobPatternFromPatterns(matchGlob)!)
		}

		if (notMatchGlob.length > 0) {
			this.notMatchGlob = new minimatch.Minimatch(generateGlobPatternFromPatterns(notMatchGlob)!)
		}
	}
	
	private showEnablingChannelMessage () {
		let message = `GLSL Include was ${this.getEnabled() ? 'enabled' : 'disabled'}`
		this.showChannelMessage(message)
		this.showStatusMessage(message)
	}

	private showChannelMessage(message: string) {
		this.channel.appendLine(message)
	}

	getEnabled(): boolean {
		return !!this.context.globalState.get('enabled', true)
	}
		
	setEnabled(enabled: boolean) {
		this.context.globalState.update('enabled', enabled)
		this.showEnablingChannelMessage()
	}

	private showStatusMessage(message: string) {
		let disposable = vscode.window.setStatusBarMessage(message, this.config.get('statusMessageTimeout') || 3000)
		this.context.subscriptions.push(disposable)
	}

	onDocumentSave(document: vscode.TextDocument) {
		if (!this.getEnabled()) {
			return
		}

		if (this.shouldFileBeCompiled(document.fileName)) {
			this.compile(document)
		}
	}

	private shouldFileBeCompiled(filePath: string) {
		let extension = path.extname(filePath).slice(1).toLowerCase()

		let glslExtensions = this.config.get('extensions', []) as string[]
		if (!glslExtensions.includes(extension)) {
			return false
		}

		if (this.matchGlob && !this.matchGlob.match(filePath)) {
			return false
		}

		if (this.notMatchGlob && this.notMatchGlob.match(filePath)) {
			return false
		}

		return true
	}
	
	private async compile(document: vscode.TextDocument) {
		let srcPath = document.fileName
		let destPath = this.generateDestPath(srcPath)
		let text = document.getText()
		let glslExtensions = this.config.get('extensions', []) as string[]

		try{
			if (destPath && text) {
				this.showChannelMessage(`Start to compile "${srcPath}"`)
				let runningStatusMessage = this.config.get('runningStatusMessage', '')
				if (runningStatusMessage) {
					this.showStatusMessage(this.formatWithVariableSubstitutions(runningStatusMessage, srcPath))
				}

				let compiled = await new GLSLCompiler(srcPath, [], glslExtensions).compile(text)
				await fs.ensureDir(path.dirname(destPath))
				await fs.writeFile(destPath, compiled)
				
				this.showChannelMessage(`"${srcPath}" compiled`)
				let finishStatusMessage = this.config.get('finishStatusMessage', '')
				if (finishStatusMessage) {
					this.showStatusMessage(this.formatWithVariableSubstitutions(finishStatusMessage, srcPath))
				}
			}
		}
		catch (err) {
			this.showChannelMessage(err)
			this.channel.show(true)
		}
	}

	private generateDestPath(srcPath: string) {
		let destPath = this.config.get('destPath', '')
		let srcDirname = this.config.get('srcDirname', '')
		let destDirPathRelativeToSrc = this.config.get('destDirPathRelativeToSrc', '')
		let dest: string | null = null

		if (srcDirname && destDirPathRelativeToSrc) {
			let srcPathPieces = srcPath.split(/[\\\/]/)
			let index = srcPathPieces.findIndex(piece => piece === srcDirname)

			if (index > -1) {
				let relativePath = srcPathPieces.slice(index + 1).join(path.sep)
				let srcDir = srcPathPieces.slice(0, index + 1).join(path.sep)
				dest = path.resolve(path.dirname(srcDir), destDirPathRelativeToSrc, relativePath)
			}
		}
		else if (destPath) {
			dest = this.formatWithVariableSubstitutions(destPath, srcPath)
		}

		return dest
	}

	private formatWithVariableSubstitutions(destPath: string, srcPath: string) {
		destPath = destPath.replace(/\${workspaceFolder}/g, vscode.workspace.rootPath || '')
		destPath = destPath.replace(/\${workspaceFolderBasename}/g, path.basename(vscode.workspace.rootPath || ''))
		destPath = destPath.replace(/\${file}/g, srcPath)
		destPath = destPath.replace(/\${fileBasename}/g, path.basename(srcPath))
		destPath = destPath.replace(/\${fileBasenameNoExtension}/g, path.basename(srcPath, path.extname(srcPath)))
		destPath = destPath.replace(/\${fileDirname}/g, path.dirname(srcPath))
		destPath = destPath.replace(/\${fileExtname}/g, path.extname(srcPath))
		destPath = destPath.replace(/\${cwd}/g, process.cwd())

		destPath = destPath.replace(/\${env\.([\w]+)}/g, (_sub: string, envName: string) => {
			return envName ? String(process.env[envName]) : ''
		})

		return destPath
	}
}