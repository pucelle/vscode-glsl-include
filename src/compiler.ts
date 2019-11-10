import * as path from 'path'
import * as fs from 'fs-extra'
const glslify = require('glslify')


export class GLSLCompiler {

	private filePath: string = ''
	private filePathChain: string[] = []
	private codes: string = ''
	private glslExtensions: string[]

	constructor(filePath: string, filePathChain: string[], glslExtensions: string[]) {
		this.filePath = filePath
		this.filePathChain = [...filePathChain, filePath]
		this.glslExtensions = glslExtensions

		if (filePathChain.includes(filePath)) {
			this.throw(new Error(`Include files circularly:\n` + this.filePathChain.join('\n')))
		}
	}

	throw(error: Error) {
		let lineCountBefore = this.codes.replace(/.+/g, '').replace(/\r\n/g, '\n').length
		throw `Error in line ${lineCountBefore + 1} of file "${this.filePath}": ${error.message}`
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
					await this.handleImport(params)
				}
			}
		}
		catch (err) {
			this.throw(err)
		}

		this.codes += text.slice(lastIndex)

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
		let compiled = await (new GLSLCompiler(includePath, this.filePathChain, this.glslExtensions).compile(text))

		this.codes += compiled
	}

	private async handleImport(params: string) {
		let match = params.match(/(.+?)\s+from\s+(.+)/)
		if (!match) {
			throw `Wrong import syntax "import ${params}"`
		}

		let importFunctions = match![1].split(/\s*,\s*/)
		let importPath = match![2].trim().replace(/^(['"])(.+?)\1$/, '$2').trim()
		let extension = path.extname(importPath).slice(1).toLowerCase()

		if (extension && this.glslExtensions.includes(extension)) {
			if (!importPath.startsWith('./')) {
				importPath = './' + importPath
			}
		}

		await this.import(importPath, importFunctions)
	}

	private async import(importPath: string, functionNames: string[]) {
		let text = functionNames.map(name => `#pragma glslify: ${name} = require(${importPath})`).join('\n')
		let glslifyCompiled = glslify.compile(text, {basedir: path.dirname(this.filePath)})
		let compiled = await (new GLSLCompiler(importPath, this.filePathChain, this.glslExtensions).compile(glslifyCompiled))

		this.codes += compiled
	}
}