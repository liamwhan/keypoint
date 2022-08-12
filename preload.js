"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.ipcRenderer.on("docLoaded", (_event, ast, file) => {
    const evt = new CustomEvent("docLoaded", { detail: { ast, file } });
    window.dispatchEvent(evt);
});
electron_1.contextBridge.exposeInMainWorld("loader", {
    relativePath: (fragment) => __awaiter(void 0, void 0, void 0, function* () { return yield electron_1.ipcRenderer.invoke("relativePath", fragment); }),
    load: (filepath) => __awaiter(void 0, void 0, void 0, function* () { return yield electron_1.ipcRenderer.invoke("load", filepath); }),
    openFile: () => __awaiter(void 0, void 0, void 0, function* () { return yield electron_1.ipcRenderer.invoke("openFile"); })
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJlbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByZWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBc0Q7QUFFdEQsc0JBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQWlCLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDcEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNsRSxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDO0FBRUgsd0JBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUc7SUFDdkMsWUFBWSxFQUFFLENBQU8sUUFBZ0IsRUFBRSxFQUFFLGtEQUFFLE9BQUEsTUFBTSxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUEsR0FBQTtJQUM3RixJQUFJLEVBQUUsQ0FBTyxRQUFnQixFQUFFLEVBQUUsa0RBQUMsT0FBQSxNQUFNLHNCQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQSxHQUFBO0lBQzVFLFFBQVEsRUFBRSxHQUFTLEVBQUUsa0RBQUMsT0FBQSxNQUFNLHNCQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBLEdBQUE7Q0FDN0QsQ0FBQyxDQUFDIn0=