export function generateGlobPatternFromPatterns(patterns: string[]): string | undefined {
	if (patterns.length > 1) {
		return '{' + patterns.join(',') + '}'
	}
	else if (patterns.length === 1) {
		return patterns[0]
	}
	
	return undefined
}


export function generateGlobPatternFromExtensions(extensions: string[]): string | undefined {
	if (extensions.length > 1) {
		return '**/*.{' + extensions.join(',') + '}'
	}
	else if (extensions.length === 1) {
		return '**/*.' + extensions[0]
	}
	return undefined
}


export function getIncludeOrImportPathFromLine(line: string): string | undefined {
	if (/#include\s+(.+)/.test(line)) {
		let includePath = line.match(/#include\s+(.+)/)![1].trim().replace(/^(['"])(.+?)\1$/, '$2').trim()
		return includePath
	}
	else if (/#import\s+.+?\s+from\s+(.+)/.test(line)) {
		let importPath = line.match(/#import\s+.+?\s+from\s+(.+)/)![1].trim().replace(/^(['"])(.+?)\1$/, '$2').trim()
		return importPath
	}
}