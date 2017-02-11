'use strict';

var vscode = require('vscode');

function activate(context) {

    console.log('Congratulations, your extension "break-from-comma" is now active!');

    var disposable = vscode.commands.registerCommand('extension.breakFromComma', function () {
        var editor = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const { document, selection } = editor;

        const { text, range } = getSelectedText(selection, document);

        /**
         * RegEx Explanation
         ,               ','
         (?=             look ahead to see if there is:
         (?:             group, but do not capture (0 or more times):
         (?:             group, but do not capture (2 times):
          [^"]*          any character except: '"' (0 or more times)
          "              '"'
         ){2}            end of grouping
         )*              end of grouping
          [^"]*          any character except: '"' (0 or more times)
         $               before an optional \n, and the end of the string
         )               end of look-ahead
         */
        let linesToIndent = text.split(/,(?=(?:(?:[^'"]*(?:'|")){2})*[^'"]*$)/)
                            .map(t => t.replace(/\s/g,'') + ',')
        // Remove the last comma
        linesToIndent[linesToIndent.length-1] = linesToIndent[linesToIndent.length-1].slice(0,-1)
        
        let leadingSpaces = [];
        let indentChar = editor.options.insertSpaces ? ' ' : '\t';
        let xmin; // The minimum amount of leading space amongst the non-empty lines
        let start = editor.selection.start;
        let offset = start.character;

        // Find out what is the minimum leading space of the non empty lines (xmin)
        linesToIndent.forEach((line, index) => {
            let _xmin = line.search(/\S/); // -1 means the line is blank (full of space characters)
            let numberOfTabs;
            if (_xmin !== -1) {
                // Normalize the line according to the indentation preferences
                if (editor.options.insertSpaces) { // When we are in SPACE mode
                    numberOfTabs = line.substring(0, _xmin).split(/\t/).length - 1;
                    _xmin += numberOfTabs * (Number(editor.options.tabSize) - 1);
                } else { // When we are in TAB mode
                    // Reduce _xmin by how many space characters are in the line
                    _xmin -= (line.substring(0, _xmin).match(/[^\t]+/g) || []).length;
                }
                if (index > 0 && (typeof xmin === 'undefined' || xmin > _xmin)) {
                    xmin = _xmin;
                }
            }
            leadingSpaces[index] = _xmin;
        });

        if (xmin === 0 && offset === 0) {
            return; // Skip indentation
        }

        linesToIndent = linesToIndent.map((line, index) => {
            let x = leadingSpaces[index];
            let chars = (index === 0 || x === -1) ? '' : indentChar.repeat(x - xmin + offset);

            return line.replace(/^\s*/, chars);
        });

        editor.edit(editBuilder => {
            editBuilder.replace(range, linesToIndent.join('\n'))
        })
        
        function getSelectedText(selection, document) {
            let range = vscode.Range;

            range = new vscode.Range(selection.start, selection.end);

            return {
                text: range ? document.getText(range) : undefined,
                range
            };
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
    vscode.window.showInformationMessage('Feel free to break-from-comma again!')
}
exports.deactivate = deactivate;