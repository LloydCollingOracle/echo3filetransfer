/**
 * Command exeecution peer: Download
 */
Echo.RemoteClient.CommandExec.DownloadCallback = Core.extend(Core.Web.Scheduler.Runnable, {
    _beforeUnloadHandler: null,
    timeInterval: 300,
    
    $construct: function(beforeUnloadHandler) {
        this._beforeUnloadHandler = beforeUnloadHandler;
    },
    
    run: function () {
        window.onbeforeunload = this._beforeUnloadHandler;
    }
});

Echo.RemoteClient.CommandExec.Download = {

    execute: function(client, commandData) {
        if (!commandData.uri) {
            throw new Error("uri not specified in DownloadCommand.");
        }
        var beforeUnloadHandler = null;
        if (window.onbeforeunload !== undefined && window.onbeforeunload !== null) {
            beforeUnloadHandler = new Echo.RemoteClient.CommandExec.DownloadCallback(window.onbeforeunload);
            window.onbeforeunload = null;
        }
        top.location = commandData.uri;
        if (beforeUnloadHandler !== null) {
            Core.Web.Scheduler.add(beforeUnloadHandler);
        }
    }
};

Echo.RemoteClient.CommandExecProcessor.registerPeer("nextapp.echo.filetransfer.app.DownloadCommand", 
        Echo.RemoteClient.CommandExec.Download);