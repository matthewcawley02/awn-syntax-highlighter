"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const parser_1 = require("./parser");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
/* Handler for connection initialisation
   Client gives its capabilities through "InitializeParams"
   Server then returns its list of capabilities to the client */
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    if (!!(capabilities.workspace && !!capabilities.workspace.configuration) === false) {
        console.log("Problem: Client does not support workspace configuration requests.");
    }
    ;
    if (!!(capabilities.workspace && !!capabilities.workspace.workspaceFolders) === false) {
        console.log("Problem: Client does not support workspace folders.");
    }
    if (!!(capabilities.textDocument && capabilities.textDocument.publishDiagnostics
        && capabilities.textDocument.publishDiagnostics.relatedInformation) == false) {
        console.log("Problem: Client does not support the textDocument/publishDiagnostics notif");
    }
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true
            },
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false
            },
            workspace: {
                workspaceFolders: {
                    supported: true
                }
            },
            semanticTokensProvider: {
                legend: {
                    tokenTypes: ['type', 'function', 'const', 'variable', 'process', 'keyword', 'comment'],
                    tokenModifiers: []
                },
                full: true
            }
        }
    };
    return result;
});
//Set up listeners on initialization
connection.onInitialized(() => {
    console.log("Initialized connection with client");
    connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
        connection.console.log('Workspace folder change event received.');
    });
    console.log("Set up listeners with client");
});
//Keep a cache of the settings of all open documents
const documentSettings = new Map();
//Handler to update document settings
connection.onDidChangeConfiguration(change => {
    documentSettings.clear();
    connection.languages.diagnostics.refresh();
});
//Get settings of a particular document. Check cache first
function getDocumentSettings(resource) {
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerExample' //I assume they set this section to include just 'maxNumberOfProblems'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
documents.onDidChangeContent(change => {
    console.log("Content of document changed");
    validateTextDocument(change.document);
});
//Handler for the "document diagnostic" request from the client
//If the document exists, attempts to validate it and returns the result
connection.languages.diagnostics.on(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (document !== undefined) {
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: await validateTextDocument(document)
        };
    }
    else {
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: []
        };
    }
});
connection.onRequest("textDocument/semanticTokens/full", (params) => {
    const document = documents.get(params.textDocument.uri);
    if (document === undefined) {
        console.log("document undefined idk");
        return {
            data: [0]
        };
    }
    else {
        const parseResult = document.getText();
    }
    //	if (parseResult.ast === null){
    //		return{ //obviously to change later
    //			data: [0]
    //		}
    //	}
    const result = [1, 1, 4, 0, 0];
    return {
        data: result
    };
});
async function validateTextDocument(textDocument) {
    const settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const parseResult = (0, parser_1.parse)(text);
    let problems = 0;
    const diagnostics = [];
    if (parseResult.errs !== null) {
        console.log(`${parseResult.errs.length} errors detected`);
        while (problems < settings.maxNumberOfProblems && problems < parseResult.errs.length) {
            const problem = parseResult.errs[problems];
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: problem.pos.line, character: problem.pos.offset },
                    end: { line: problem.pos.line, character: problem.pos.offset + 1 }
                },
                message: problem.toString()
            };
            diagnostics.push(diagnostic);
            problems++;
        }
    }
    /*while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
        problems++;
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: `${m[0]} is all uppercase.`,
            source: 'ex'
        };
        diagnostic.relatedInformation = [
            {
                location: {
                    uri: textDocument.uri,
                    range: Object.assign({}, diagnostic.range)
                },
                message: 'Example warning: this is all uppercase'
            },
        ];
        diagnostics.push(diagnostic);
    } */
    return diagnostics;
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received a file change event');
});
// Text completion
connection.onCompletion((_textDocumentPosition) => {
    // Note that the parameter includes the cursor location, can use that in the future
    return [
        {
            label: 'forall',
            kind: node_1.CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'exists',
            kind: node_1.CompletionItemKind.Text,
            data: 2
        },
        {
            label: 'lambda',
            kind: node_1.CompletionItemKind.Text,
            data: 3
        },
        {
            label: 'include',
            kind: node_1.CompletionItemKind.Text,
            data: 4
        },
        {
            label: 'proc',
            kind: node_1.CompletionItemKind.Text,
            data: 5
        },
        {
            label: 'INCLUDES:',
            kind: node_1.CompletionItemKind.Text,
            data: 6
        },
        {
            label: 'TYPES:',
            kind: node_1.CompletionItemKind.Text,
            data: 7
        },
        {
            label: 'VARIABLES:',
            kind: node_1.CompletionItemKind.Text,
            data: 8
        },
        {
            label: 'CONSTANTS:',
            kind: node_1.CompletionItemKind.Text,
            data: 9
        },
        {
            label: 'FUNCTIONS:',
            kind: node_1.CompletionItemKind.Text,
            data: 10
        },
        {
            label: 'PROCESSES:',
            kind: node_1.CompletionItemKind.Text,
            data: 11
        },
        {
            label: 'ALIASES:',
            kind: node_1.CompletionItemKind.Text,
            data: 12
        },
        {
            label: 'unicast',
            kind: node_1.CompletionItemKind.Text,
            data: 13
        },
        {
            label: 'broadcast',
            kind: node_1.CompletionItemKind.Text,
            data: 14
        },
        {
            label: 'groupcast',
            kind: node_1.CompletionItemKind.Text,
            data: 15
        },
        {
            label: 'send',
            kind: node_1.CompletionItemKind.Text,
            data: 16
        },
        {
            label: 'deliver',
            kind: node_1.CompletionItemKind.Text,
            data: 17
        },
        {
            label: 'receive:',
            kind: node_1.CompletionItemKind.Text,
            data: 18
        },
    ];
});
// Additional text alongside the text completion
connection.onCompletionResolve((item) => {
    switch (item.data) {
        default:
            item.detail = 'tba';
            item.documentation = 'tba';
            return item;
    }
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map