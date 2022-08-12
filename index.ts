import { app, BrowserWindow, ipcMain, dialog, Menu, OpenDialogSyncOptions, protocol } from "electron";
import { lexer } from "./AST/Lexer";
import { parse } from "./AST/Parser";
import path from "path";
import fs from "fs";

if (require('electron-squirrel-startup')) app.quit();

let win: BrowserWindow;

function load(filePath: string)
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

const openFile = (): void => {
    const options: OpenDialogSyncOptions  = {
        title: "Open Slide Deck",
        filters: [
            {name: "Slide Deck Files (*.kp)", extensions: ["kp"] },
            {name: "All files (*.*)", extensions: ["*"]}
        ],
        properties: ["openFile"]
    };
    const selectedFiles = dialog.showOpenDialogSync(win, options);
    if (selectedFiles && selectedFiles.length)
    {
        const file = selectedFiles[0];
        const ast = load(file);
        win.webContents.send("docLoaded", ast, file);
        
    }
}

const createWindow = ():void => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "Preload.js")

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
    win.webContents.openDevTools();
    ipcMain.handle("relativePath", (event, fragment) => path.resolve(__dirname, fragment));
    ipcMain.handle("load", (event, file) => load(file));
    ipcMain.handle("fileOpen", (event) => openFile())
    win.loadFile("index.html");
};

protocol.registerSchemesAsPrivileged([
    { scheme: "keypoint", privileges: { bypassCSP: true, standard: true }}
]);

app.whenReady().then(() => {
    protocol.registerFileProtocol("keypoint", (request, callback) => {
        const url = request.url.substring(7);
        callback({path: path.normalize(`${__dirname}/${url}`)});
    });
    
    createWindow();
});