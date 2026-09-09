interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer: import("electron").IpcRenderer;
    appInfo: {
        version: string;
    };
    changelog: {
        data: {
            versions: Array<{
                version: string;
                date: string;
                newFeatures?: string[];
                fixes?: string[];
            }>;
        };
    };
}