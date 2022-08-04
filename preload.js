const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("loader",  {
    relativePath: async (fragment) =>  await ipcRenderer.invoke("relativePath", fragment),
    load: async (filepath) => await ipcRenderer.invoke("load", filepath)
});