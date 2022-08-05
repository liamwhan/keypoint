const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const { lexer } = require(path.join(__dirname, "AST/Lexer.js"));
const { parse } = require(path.join(__dirname, "AST/Parser.js"));
const fs = require("fs");

let win;

function load(filePath)
{
    if (!fs.existsSync(filePath))
    {
        throw new Error("File not found");
    }

    const input = fs.readFileSync(filePath, {encoding: "utf8"});
    const tokens = lexer(input);
    const ast = parse(tokens);
    return ast;
}

const openFile = () => {
    const options  = {
        title: "Open Slide Deck",
        filters: [
            {name: "Slide Deck Files (*.kp)", extensions: ["kp"] },
            {name: "All files (*.*)", extensions: ["*"]}
        ],
        properties: ["openFile"]
    };
    const selectedFiles = dialog.showOpenDialogSync(win, options);
    if (selectedFiles.length > 0)
    {
        const file = selectedFiles[0];
        const ast = load(file);
        win.webContents.send("docLoaded", ast, file);
        
    }
}

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")

        }
    });
    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Open",
                    click: () => openFile()
                },
                {
                    label: "Exit",
                    click: () => app.quit()
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);
    // win.webContents.openDevTools();
    ipcMain.handle("relativePath", (event, fragment) => path.resolve(__dirname, fragment));
    ipcMain.handle("load", (event, file) => load(file));
    ipcMain.handle("fileOpen", (event) => openFile())
    win.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow()
});