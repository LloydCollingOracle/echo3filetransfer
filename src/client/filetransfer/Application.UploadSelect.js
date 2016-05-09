/**
 * File transfer root namespace object.  Components are contained directly in this namespace.
 * @namespace
 */
FileTransfer = { };

/**
 * Abstract base class for upload components.
 * 
 * @sp {Boolean} autoSend flag indicating whether upload should be sent automatically in response to a "ready" event 
 */
FileTransfer.AbstractUploadSelect = Core.extend(Echo.Component, {
    
    $static: {
        
        /**
         * Generates a new unique identifier for use by the upload process manager.
         * 
         * @return the generated identifier
         * @type String
         */
        generateId: function() {
        	Core.Debug.consoleWrite("FU AbstractUploadSelect.generateId enter");
            var out = "", i = 0, random;
            for (i = 0; i < 16; ++i) {
                random = (Math.round(Math.random() * 0x10000)).toString(16);
                out += "0000".substring(random.length) + random;
            }
        	Core.Debug.consoleWrite("FU AbstractUploadSelect.generateId exit");
            return out;
        }
    },
    
    $abstract: true,
    
    /**
     * Flag indicating whether the upload component is actively sending file data to the server.
     * @type Boolean
     */
    sending: false,
    
    /**
     * The upload process id.  Generated at construction.
     * @type String
     */
    processId: null,
    
    /**
     * Constructor.
     */
    $construct: function(data) {
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.$construct enter");
        this.processId = FileTransfer.AbstractUploadSelect.generateId();
	    Core.Debug.consoleWrite("FU Application.UploadSelect.AbstractUploadSelect.construct Process id is " + this.processId);
		for (var i in data) {
		    Core.Debug.consoleWrite("FU data, " + i + " = " + data[i]);
		}
        Echo.Component.call(this, data);
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.$construct exit");
    },
    
    /**
     * Notifies <code>uploadCancel</code> listeners that the upload operation has been canceled.
     * Performs no operation if an upload sending is not in progress.
     * Sets sending state to false.
     */
    cancel: function() {
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.cancel enter");
	    Core.Debug.consoleWrite("FU Cancel called for process " + this.processId);
        if (!this.sending) {
	    Core.Debug.consoleWrite("FU Not sending uploadCancel event as sending is false");
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.cancel exit");
            return;
        }
        this.sending = false;
	    Core.Debug.consoleWrite("FU firing uploadCancel event");
        this.fireEvent({ source: this, type: "uploadCancel" });
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.cancel exit");
    },
    
    /**
     * Notifies <code>uploadComplete</code> listeners that the upload operation has completed.
     * Performs no operation if an upload sending is not in progress.
     * Sets sending state to false.
     */
    complete: function() {
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.complete enter");
	    Core.Debug.consoleWrite("FU Completed " + this.processId);
        if (!this.sending) {
	    Core.Debug.consoleWrite("FU Not sending uploadComplete event as sending is false");
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.complete exit");
            return;
        }
        this.sending = false;
	    Core.Debug.consoleWrite("FU firing uploadComplete event");
        this.fireEvent({ source: this, type: "uploadComplete", data: this.processId });
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.complete exit");
    },
    
    /**
     * Notifies <code>uploadReady</code> listeners that the files to uploaded have been selected and are ready for uploading.
     * If the property <code>autoSend</code> is set, the <code>send()</code> method will be subsequently invoked. 
     */
    ready: function() {
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.ready enter");
	    Core.Debug.consoleWrite("FU Ready : " + this.processId + " firing uploadReady");
        this.fireEvent({ source: this, type: "uploadReady" });
        if (this.render("autoSend", true)) {
            this.send();
        }
    	Core.Debug.consoleWrite("FU AbstractUploadSelect.ready exit");
    },
    
    /**
     * Sends the upload.
     * Performs no operation if upload sending is already in progress.
     * Sets sending state to true.
     */
    send: function() {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.fireEvent({ source: this, type: "uploadSend", data: this.processId });
    }
});

/**
 * UploadSelect component.
 */
FileTransfer.UploadSelect = Core.extend(FileTransfer.AbstractUploadSelect, {
    
    $load: function() {
        Echo.ComponentFactory.registerType("FileTransfer.UploadSelect", this);
    },
    
    /** @see Echo.Component#componentType */
    componentType: "FileTransfer.UploadSelect"
});
