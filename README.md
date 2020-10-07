**This plugin is deprecated because not good enough.**

<h1 align="left">
    <img src="https://github.com/pucelle/vscode-glsl-include/raw/master/images/logo.png" width="48" height="48" alt="a save logo" />
    GLSL include - VSCode Extension
</h1>

GLSL include is a tool to compile glsl file after it was saved.



## Features

Supports compiling glsl file which include `#include` and `#import` to a standard glsl file.

You can config where to output the compiled files, and shows some status message for you.

Supports `#include` and `import` path completion, and go to definition.

This plugin uses [glslify](https://github.com/glslify/glslify) to implement `#import` and `export`, so we also supports all the features of it.



## Include, Import and Export

#### Include a file:

```
#include ./dir/file-name.frag
```


#### Import modules from file:

```
#import module1, module2 from ./dir/file-name.frag
```

It's shorthand for:

```
#pragma glslify: module1 = require(./dir/file-name.frag)
#pragma glslify: module2 = require(./dir/file-name.frag)
```


#### Export modules from file:

```
#export module1, module2
```

It's shorthand for:

```
#pragma glslify: export(module1)
#pragma glslify: export(module2)
```


## Configuration

| Name                                   | Description
| ---                                    | ---
| `GLSLInclude.extensions`               | GLSL language extensions, files with extension in this list will be compiled. Default value is `["vs", "fs", "gs", "comp", "vert", "tesc", "tese", "frag", "geom", "glsl", "glslv", "glslf", "glslg"]`.
| `GLSLInclude.runningStatusMessage`     | Specify the status bar message when compiling began.
| `GLSLInclude.finishStatusMessage`      | Specify the status bar message after compiling finished.
| `GLSLInclude.statusMessageTimeout`     | Specify the timeout millisecond after which the status bar message will hide. Default value is `3000`, means 3 seconds.
| `GLSLInclude.matchGlob`                | Specify a glob pattern to match file path, only matched files will be compiled.
| `GLSLInclude.notMatchGlob`             | Specify a glob pattern to match file path, matched files will not be compiled.
| `GLSLInclude.destPath`                 | Specify where the compiled file should be saved, If `srcDirname` and `destDirPathRelativeToSrc` specified, this option will be ignored. Default value is `${fileDirname}/${fileBasenameNoExtension}-compiled${fileExtname}`.
| `GLSLInclude.srcDirname`               | Specify the source directory name (not a path), If file path includes it, the path will be formatted as a relative path, then `destRelativePath` joined with it as a dest path.
| `GLSLInclude.destDirPathRelativeToSrc` | Specify the dest directory relative to `srcDirname`, which will be joined with the relative path formatted from `srcDirname`, then generate a dest path.



### Variable Substitution

Can be used in `destPath`, `destDirRelativeToSrc`.

For more details please refer to [VSCode Tasks](https://code.visualstudio.com/docs/editor/tasks#_variable-substitution).

| Name                         | Description
| ---                          | ---
| `${workspaceFolder}`         | the path of the folder opened in VS Code.
| `${workspaceFolderBasename}` | the name of the folder opened in VS Code without any slashes (/).
| `${file}`                    | the path of current opened file.
| `${fileBasename}`            | the basename part of current opened file.
| `${fileBasenameNoExtension}` | the basename part without extension of current opened file.
| `${fileDirname}`             | the dirname part of current opened file.
| `${fileExtname}`             | the extension part of current opened file.
| `${cwd}`                     | the task runner's current working directory on startup.
| `${env.Name}`                | reference environment variables.



### Sample Configuration

Save compiled glsl to same directory, with a suffix `-compiled`.

```json
{
    "GLSLInclude.runningStatusMessage": "Compiling ${fileBasename}...",
    "GLSLInclude.finishStatusMessage": "${fileBasename} compiled",
    "GLSLInclude.destPath": "${fileDirname}/${fileBasenameNoExtension}-compiled${fileExtname}",
}
```


Save compiled glsl to parent directory.

```json
{
    "GLSLInclude.runningStatusMessage": "Compiling ${fileBasename}...",
    "GLSLInclude.finishStatusMessage": "${fileBasename} compiled",
    "GLSLInclude.destPath": "${fileDirname}/../${fileBasename}",
}
```


Save compiled glsl from `src` to `dest`, and keep it's relative path from `src`.

```json
{
    "GLSLInclude.runningStatusMessage": "Compiling ${fileBasename}...",
    "GLSLInclude.finishStatusMessage": "${fileBasename} compiled",
    "GLSLInclude.srcDirname": "src",
    "GLSLInclude.destDirPathRelativeToSrc": "dest",
}
```


## Commands

The following commands are exposed in the command palette

- `GLSL Include: Enable` - to enable the extension
- `GLSL Include: Disable` - to disable the extension



## License

MIT
