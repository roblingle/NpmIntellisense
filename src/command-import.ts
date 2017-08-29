import { workspace, window, TextEditorEdit, QuickPickOptions, QuickPickItem, Selection } from 'vscode';
import { dirname } from 'path';
import { getNpmPackages } from './provide';
import { fsf } from './fs-functions';
import { State } from './State';
import { getConfig, Config } from './config';
import { getImportStatementFromFilepath, getQuickPickItems, guessVariableName } from './util';

const quickPickOptions : QuickPickOptions = {
    matchOnDescription: true
}

export function onImportCommand() {
    const config = getConfig();
    window.showQuickPick(getPackages(config), quickPickOptions)
        .then(selection => addImportStatementToCurrentFile(selection, config));
}

function getPackages(config: Config): QuickPickItem[] {
    const state : State = {
        filePath: dirname(window.activeTextEditor.document.fileName),
        rootPath: workspace.rootPath,
        cursorLine: undefined,
        cursorPosition: undefined,
        textCurrentLine: undefined
    };

    return getNpmPackages(state, config, fsf)
    			.then(npmPackages => npmPackages.map(moduleNameToQuickPickItem))
    			.catch(error => window.showErrorMessage(error) );
}

function moduleNameToQuickPickItem(moduleName: string) : QuickPickItem {
    return {
        label: moduleName,
        description: 'npm module'
    };
}

function addImportStatementToCurrentFile(item: QuickPickItem, config: Config) {
    const statementES6 = `import {  } from ${config.importQuotes}${item.label}${config.importQuotes}${config.importLinebreak}`;
    const statementRequire = `${config.importDeclarationType} ${guessVariableName(item.label)} = require(${config.importQuotes}${item.label}${config.importQuotes})${config.importLinebreak}`;
    const statement = config.importES6 ? statementES6 : statementRequire;
    const insertLocation = window.activeTextEditor.selection.start;
    window.activeTextEditor.edit(edit => edit.insert(insertLocation, statement));
    // Move cursor into import braces
    const position = window.activeTextEditor.selection.active;
    const positionLine = config.importLinebreak.includes('\r\n') ? position.line - 1 : position.line;
    const newPosition = position.with(positionLine, 9);
    const newSelection = new Selection(newPosition, newPosition);
    window.activeTextEditor.selection = newSelection;
}

