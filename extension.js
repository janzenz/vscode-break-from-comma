'use strict';

var vscode = require('vscode');

function activate(context) {

    console.log('Congratulations, your extension "break-from-comma" is now active!');

    const disposable = vscode.commands.registerCommand('extension.breakFromComma', () => {
        const editor = vscode.window.activeTextEditor

        if (!editor) {
            return
        }

        const { document, selection } = editor

        if (selection.isEmpty) {
            return
        }

        const text = document.getText(selection)

        // Range of selection to be replaced
        let range = new vscode.Range(selection.start, selection.end)
        
        const entireLine = document.lineAt(selection.start.line)
        const remainingLine = document.getText(new vscode.Range(selection.end, entireLine.range.end))
        // Count the leading spaces and include it in the selection range if any
        const leadingSpaces = remainingLine.search(/\S/)
        if (leadingSpaces > 0) {
            range = new vscode.Range(selection.start.line,
                                        selection.start.character, 
                                        selection.start.line,
                                        selection.end.character + leadingSpaces)
        }

        /**
         * RegEx Explanation
         ,               ','
         (?=             look ahead to see if there is:
         (?:             group, but do not capture (0 or more times):
         (?:             group, but do not capture (2 times):
          [^'"]*         any character except: '"' (0 or more times)
         (?:'|")"        '"'
         ){2}            end of grouping
         )*              end of grouping
         [^'"]*         any character except: '"' (0 or more times)
         $               before an optional \n, and the end of the string
         )               end of look-ahead
         */
        let linesToIndent = text.split(/,(?=(?:(?:[^'"]*(?:'|")){2})*[^'"]*$)/)
                            .map(t => t.replace(/\s/g,'') + ',')
        
        const { insertSpaces, tabSize } = editor.options
        const indentChar = insertSpaces ? ' ' : '\t';
        const start = editor.selection.start;
        const offset = Math.ceil(start.character / tabSize) * (insertSpaces ? tabSize : 1)
        const chars = indentChar.repeat(offset)
        const lastOffset = offset - (insertSpaces ? tabSize : 1)
        const lastIndent = (lastOffset > 0) ? indentChar.repeat(lastOffset) : ''
        
        linesToIndent = linesToIndent.map((line, index) => {
            let tempChars = chars

            if (index === 0 && start.character !== 0) {
                tempChars = '\n' + chars
            }
            
            return tempChars + line
        })

        // Remove the last comma and add indentation
        linesToIndent[linesToIndent.length-1] = linesToIndent[linesToIndent.length-1].slice(0,-1) + '\n' + lastIndent

        editor.edit(editBuilder => {
            editBuilder.replace(range, linesToIndent.join('\n'))
        })
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
    vscode.window.showInformationMessage('Feel free to break-from-comma again!')
}
exports.deactivate = deactivate;