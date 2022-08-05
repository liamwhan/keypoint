const { contextBridge, ipcRenderer } = require("electron");

ipcRenderer.on("docLoaded", (_event, ast, file) => {
    const evt = new CustomEvent("docLoaded", { detail: {ast, file} });
    window.dispatchEvent(evt);
});

contextBridge.exposeInMainWorld("loader",  {
    relativePath: async (fragment) =>  await ipcRenderer.invoke("relativePath", fragment),
    load: async (filepath) => await ipcRenderer.invoke("load", filepath),
    openFile: async () => await ipcRenderer.invoke("openFile")
});