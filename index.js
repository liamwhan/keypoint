"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Lexer_1 = require("./AST/Lexer");
const Parser_1 = require("./AST/Parser");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let win;
function load(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error("File not found");
    }
    const input = fs_1.default.readFileSync(filePath, { encoding: "utf8" });
    const tokens = (0, Lexer_1.lexer)(input);
    const ast = (0, Parser_1.parse)(tokens);
    return ast;
}
const openFile = () => {
    const options = {
        title: "Open Slide Deck",
        filters: [
            { name: "Slide Deck Files (*.kp)", extensions: ["kp"] },
            { name: "All files (*.*)", extensions: ["*"] }
        ],
        properties: ["openFile"]
    };
    const selectedFiles = electron_1.dialog.showOpenDialogSync(win, options);
    if (selectedFiles && selectedFiles.length) {
        const file = selectedFiles[0];
        const ast = load(file);
        win.webContents.send("docLoaded", ast, file);
    }
};
const createWindow = () => {
    win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js")
        }
    });
    const menu = electron_1.Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Open",
                    click: () => openFile()
                },
                {
                    label: "Exit",
                    click: () => electron_1.app.quit()
                }
            ]
        }
    ]);
    electron_1.Menu.setApplicationMenu(menu);
    win.webContents.openDevTools();
    electron_1.ipcMain.handle("relativePath", (event, fragment) => path_1.default.resolve(__dirname, fragment));
    electron_1.ipcMain.handle("load", (event, file) => load(file));
    electron_1.ipcMain.handle("fileOpen", (event) => openFile());
    win.loadFile("index.html");
};
electron_1.app.whenReady().then(() => {
    createWindow();
});
