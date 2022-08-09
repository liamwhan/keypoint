import { contextBridge, ipcRenderer } from "electron";

ipcRenderer.on("docLoaded", (_event, ast: DocumentNode, file: string) => {
    const evt = new CustomEvent("docLoaded", { detail: {ast, file} });
    window.dispatchEvent(evt);
});

contextBridge.exposeInMainWorld("loader",  {
    relativePath: async (fragment: string) =>  await ipcRenderer.invoke("relativePath", fragment),
    load: async (filepath: string) => await ipcRenderer.invoke("load", filepath),
    openFile: async () => await ipcRenderer.invoke("openFile")
});