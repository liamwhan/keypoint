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
if (require('electron-squirrel-startup'))
    electron_1.app.quit();
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
            preload: path_1.default.join(__dirname, "Preload.js")
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
electron_1.protocol.registerSchemesAsPrivileged([
    { scheme: "keypoint", privileges: { bypassCSP: true, standard: true } }
]);
electron_1.app.whenReady().then(() => {
    electron_1.protocol.registerFileProtocol("keypoint", (request, callback) => {
        const url = request.url.substring(7);
        callback({ path: path_1.default.normalize(`${__dirname}/${url}`) });
    });
    createWindow();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHVDQUFzRztBQUN0Ryx1Q0FBb0M7QUFDcEMseUNBQXFDO0FBQ3JDLGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsSUFBSSxPQUFPLENBQUMsMkJBQTJCLENBQUM7SUFBRSxjQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFFckQsSUFBSSxHQUFrQixDQUFDO0FBRXZCLFNBQVMsSUFBSSxDQUFDLFFBQWdCO0lBRTFCLElBQUksQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUM1QjtRQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE1BQU0sS0FBSyxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7SUFDNUQsTUFBTSxNQUFNLEdBQUcsSUFBQSxhQUFLLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBQSxjQUFLLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsTUFBTSxRQUFRLEdBQUcsR0FBUyxFQUFFO0lBQ3hCLE1BQU0sT0FBTyxHQUEyQjtRQUNwQyxLQUFLLEVBQUUsaUJBQWlCO1FBQ3hCLE9BQU8sRUFBRTtZQUNMLEVBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RELEVBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFDO1NBQy9DO1FBQ0QsVUFBVSxFQUFFLENBQUMsVUFBVSxDQUFDO0tBQzNCLENBQUM7SUFDRixNQUFNLGFBQWEsR0FBRyxpQkFBTSxDQUFDLGtCQUFrQixDQUFDLEdB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