import * as path from 'path'
import * as fs from 'fs-extra'
const glslify = require('glslify')


export class GLSLCompiler {

	private filePath: string = ''
	private filePathChain: string[] = []
	private codes: string = ''

	constructor(filePath: string, filePathChain: string[]) {
		this.filePath = filePath
		this.filePathChain = [...filePathChain, filePath]

		if (filePathChain.includes(filePath)) {
			this.throw(new Error(`Include files circularly:\n` + this.filePathChain.join('\n')))
		}
	}

	throw(error: Error) {
		let lineCountBefore = this.codes.replace(/.+/g, '').replace(/\r\n/g, '\n').length
		throw `Error in line ${lineCountBefore + 1} of file "${this.filePath}":\n${error.message}`
	}

	async compile(text: string) {
		let re = /#(include|import)\s+(.+)/g
		let match: RegExpExecArray | null
		let lastIndex = 0

		try{
			while (match = re.exec(text)) {
				this.codes += text.slice(lastIndex, match.index)
				lastIndex = re.lastIndex

				let command = match[1]
				let params = match[2]

				if (command === 'include') {
					await this.handleInclude(params)
				}
				else {
					this.codes += match[0]
				}
			}
		}
		catch (err) {
			this.throw(err)
		}

		this.codes += text.slice(lastIndex)

		this.compileImport()

		return this.codes
	}

	private async handleInclude(params: string) {
		let includePath = params.trim().replace(/^(['"])(.+?)\1$/, '$2')
		let resolvedIncludePath = path.resolve(path.dirname(this.filePath), includePath)
		
		if (!fs.pathExists(resolvedIncludePath)) {
			throw `Failed to include "${resolvedIncludePath}"`
		}

		await this.include(resolvedIncludePath)
	}

	private async include(includePath: string) {
		let text = (await fs.readFile(includePath)).toString()
		let compiled = await (new GLSLCompiler(includePath, this.filePathChain).compile(text))

		this.codes += compiled
	}

	private async compileImport() {
		this.codes = glslify.compile(this.codes, {basedir: path.dirname(this.filePath)})
	}
}