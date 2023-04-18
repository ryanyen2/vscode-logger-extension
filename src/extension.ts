import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

let logFilePath: string;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.logUserAction:start",
    () => {
      // Prompt user for user number
      vscode.window
        .showInputBox({ placeHolder: "Enter user number" })
        .then((userNumber) => {
          // Create log file for this user
          const logFolderPath = `/Users/r4yen/Desktop/Research/SearchNGen/Formative Study/logs/User${userNumber}`;
          if (!fs.existsSync(logFolderPath)) {
            fs.mkdirSync(logFolderPath, { recursive: true });
          }

          // store in json
          const logFileName = `log_${new Date()
            .toLocaleString()
            .replace(/\//g, "-")
            .replace(/,/g, "")
            .replace(/:/g, "-")
            .replace(/ /g, "_")}.json`;
          logFilePath = path.join(logFolderPath, logFileName);
          console.log("Filr>> ", logFilePath);

          // Log user actions
          // const writeAction = (action: string, data: any) => {
          //   fs.appendFileSync(
          //     logFilePath,
          //     JSON.stringify({
          //       action,
          //       time: new Date().toISOString(),
          //       ...data,
          //     }) + "\n"
          //   );
          // }

          // Log initialisation
          logUserEvent("initialisation");

          // Watch for text input events
          let disposable = vscode.Disposable.from(
            vscode.workspace.onDidChangeTextDocument((event) => {
              // console.log("event>> ", event);
              // const text = event.document.getText();

              // const textBeforeCursor = the text before the cursor only in the current line
              const textBeforeCursor = event.document.getText(
                // new vscode.Range(position.with(undefined, 0), position)
                new vscode.Range(
                  event.document.positionAt(event.document.offsetAt(event.contentChanges[0].range.start) - 1),
                  event.document.positionAt(event.document.offsetAt(event.contentChanges[0].range.start))
                )
              );

              console.log("textBeforeCursor>> ", textBeforeCursor);
              
              const keyInput = event.contentChanges[0]
              console.log('keyInput>> ', keyInput);
              if (keyInput.text === " ") {
                logUserEvent("space");
              } else if (keyInput.text.includes("\n")) {
                logUserEvent("enter");
              } else if (keyInput.text.includes("\t")) {
                logUserEvent("tab");
              } else if (keyInput.text === "") {
                logUserEvent("backspace");
              } else if (keyInput.text.length > 1) {
                logUserEvent("pasteOrCopilot", { content: keyInput.text });
              } 

              // if == '': new world, == '//': new command
              if (textBeforeCursor === "") {
                logTextChanges(event, "new world");
              } else if (textBeforeCursor === "//") {
                logTextChanges(event, "new command");
              } else {
                logTextChanges(event, "edit");
              }
            }),

            // vscode.commands.registerCommand(
            //   "extension.logSuggestionAccepted",
            //   () => {
            //     logUserEvent("acceptSuggestion");
            //   }
            // ),

            // vscode.window.onDidChangeTextEditorSelection((event) => {
            //   logTextSelection(event);
            // }),

            // Watch for file events
            vscode.workspace.onDidCreateFiles((event) => {
              const type = "create file";
              const content = event.files[0].fsPath;

              logUserEvent("fileOperation", { type, content });
            }),
            vscode.workspace.onDidOpenTextDocument((event) => {
              const type = "open file";
              const content = event.uri.fsPath;
              logUserEvent("fileOperation", { type, content });
            }),
            vscode.workspace.onDidDeleteFiles((event) => {
              const type = "delete file";
              const content = event.files[0].fsPath;
              logUserEvent("fileOperation", { type, content });
            }),
            vscode.workspace.onDidCloseTextDocument((event) => {
              const type = "close file";
              const content = event.uri.fsPath;
              logUserEvent("fileOperation", { type, content });
            }),

            // Watch for editor focus events
            vscode.window.onDidChangeWindowState((event) => {
              const type = "focus";
              const content = event.focused ? "focused" : "unfocused";
              logUserEvent("focus", { type, content });
            })
          );
        });
    }
  );

  let disposable3 = vscode.commands.registerCommand('type', (args) => {
    // Handle when the user types a character
    console.log("args>> ", args.text, args.source, vscode.window.activeTextEditor?.selection.isEmpty);
    vscode.commands.executeCommand('default:type', args);
  });

  context.subscriptions.push(disposable, disposable3);
}

function logTextChanges(event: vscode.TextDocumentChangeEvent, type: string) {
  let logEntry = {
    time: Date.now(),
    action: "textChange",
    type: type,
    filename: event.document.fileName,
    changes: event.contentChanges.map((change) => {
      return {
        range: change.range,
        rangeOffset: event.document.offsetAt(change.range.start),
        rangeLength: change.rangeLength,
        text: change.text,
      };
    }),
  };
  let logFileContent = JSON.stringify(logEntry);
  fs.appendFileSync(logFilePath, logFileContent);
}

function logUserEvent(eventName: string, data?: any) {
  let logEntry = {
    time: Date.now(),
    eventName: eventName,
    ...data,
  };
  // let logFilePath = vscode.workspace.rootPath + "/log.json";
  let logFileContent = JSON.stringify(logEntry);
  fs.appendFileSync(logFilePath, logFileContent);
}

function logTextSelection(event: vscode.TextEditorSelectionChangeEvent) {
  let logEntry = {
    time: Date.now(),
    action: "selection",
    filename: event.textEditor.document.fileName,
    selection: event.selections.map((selection) => {
      return {
        active: selection.active,
        anchor: selection.anchor,
        start: selection.start,
        end: selection.end,
        isReversed: selection.isReversed,
      };
    }),
  };
  let logFileContent = JSON.stringify(logEntry);
  fs.appendFileSync(logFilePath, logFileContent);
}
