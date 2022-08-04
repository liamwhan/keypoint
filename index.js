const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { lexer } = require(path.join(__dirname, "AST/Lexer.js"));
const { parse } = require(path.join(__dirname, "AST/Parser.js"));
const fs = require("fs");

function load(filePath)
{
    if (!fs.existsSync(filePath))
    {
        throw new Error("File not found");
    }

    const input = fs.readFileSync(filePath, {encoding: "utf8"});
    const tokens = lexer(input);
    const ast = parse(tokens);
    return JSON.stringify(ast);
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true

        }
    });
    win.webContents.openDevTools();
    ipcMain.handle("relativePath", (event, fragment) => path.resolve(__dirname, fragment));
    ipcMain.handle("load", (event, file) => load(file));
    win.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow()
});