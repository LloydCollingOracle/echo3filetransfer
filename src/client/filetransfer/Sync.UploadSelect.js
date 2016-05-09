/**
 * File Transfer components synchronization peer namespace.  Any objects in this namespace should not be accessed by application 
 * developers or extended outside of the File Transfer library.
 * @namespace
 */
FileTransfer.Sync = { };

/**
 * Abstract base class for file upload synchronization peers.
 */
FileTransfer.Sync.AbstractUploadSelect = Core.extend(Echo.Render.ComponentSync, {

    $abstract: true,
    
    /**
     * The <code>FileTransfer.Sync.UploadRender</code> instance in use.
     */
    uploadRender: null,

    /**
     * Method to receive events from component.
     * @type Function 
     */
    _componentListener: null,
    
    /**
     * Root DIV element.
     * @type Element
     */
    div: null,
    
    /**
     * <code>ProgressDisplay</code> implementation used to report progress visually to user.
     * @type FileTransfer.Sync.ProgressDisplay
     */
    progressDisplay: null,
    
    /**
     * Parameters which should be appended to upload receiver/monitor URLs.
     * Each element should be a string of the format "key=value", URL encoded.
     * @type Array
     */
    urlParameters: null,
    
    /**
     * Constructor.
     */
    $construct: function() {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.construct enter");
        this._componentListener = Core.method(this, function(e) {

            switch (e.type) {
            case "uploadCancel":
                this.uploadRender.cancel();
                break;
            case "uploadSend":
                this.send();
                break;
            }
        });
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.construct exit");
    },
    
    /**
     * Peer renderAdd() implementation, delegates rendering to the 
     * add() method of <code>FileTransfer.Sync.UploadRender</code> object.
     * @see Echo.Render.ComponentSync#renderAdd 
     */
    renderAdd: function(update, parentElement) {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderAdd enter");
        this.component.addListener("uploadCancel", this._componentListener);
        this.component.addListener("uploadSend", this._componentListener);
        this.urlParameters = [];
        this.urlParameters.push("pid=" + this.component.processId);
        var componentParameters = this.component.get("parameters");
        if (componentParameters) {
            for (var x in componentParameters) {
                this.urlParameters.push(x + "=" + componentParameters[x]);
            }
        }
        
        if (!this.uploadRender) {
            this.uploadRender = new FileTransfer.Sync.DefaultUploadRender(); 
        }
        this.uploadRender.peer = this;
        this.div = document.createElement("div");
        this.div.id = this.component.renderId;
        this.uploadRender.add();
        parentElement.appendChild(this.div);
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderAdd exit");
    },

    /** 
     * Peer renderDisplay() implementation, delegates rendering to the 
     * (optional) display() method of <code>FileTransfer.Sync.UploadRender</code> object, if provided.
     * @see Echo.Render.ComponentSync#renderDisplay 
     */
    renderDisplay: function() {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderDisplay enter");
        if (this.uploadRender.display) {
            this.uploadRender.display();
        }
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderDisplay exit");
    },
    
    /**
     * Peer renderDispose() implementation, delegates rendering to the 
     * dispose() method of <code>FileTransfer.Sync.UploadRender</code> object.
     * @see Echo.Render.ComponentSync#renderDispose 
     */
    renderDispose: function(update) {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderDispose enter");
        this.component.removeListener("uploadCancel", this._componentListener);
        this.component.removeListener("uploadSend", this._componentListener);
        if (this.progressDisplay) {
            this.progressDisplay.dispose();
        }
        
        this.component.cancel();
        this.uploadRender.dispose(this.div);
        this.uploadRender.disposed = true;
        this.div = null;
        this.uploadRender.peer = null;
        this.uploadRender = null;
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderDispose exit");
    },
    
    /**
     * Disposes rendered elements and re-renders control to DOM.
     * Invokes renderDispose(), followed by renderAdd().
     * @see Echo.Render.ComponentSync#renderUpdate 
     */
    renderUpdate: function(update) {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderUpdate enter");
        var element = this.div;
        var containerElement = element.parentNode;
        Echo.Render.renderComponentDispose(update, update.parent);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.renderUpdate exit");
        return true;
    },
    
    /**
     * Notifies the <code>FileTransfer.Sync.UploadRender</code> to send the file.
     */
    send: function() {
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.send enter");
        this.progressDisplay = FileTransfer.Sync.ProgressDisplay.instantiate(this.component);
        this.progressDisplay.create(this.div);
        this.uploadRender.send();
    	Core.Debug.consoleWrite("FU Sync.AbstractUploadSelect.send exit");
    }
});

/**
 * Abstract base class for "UploadRender" objects. Contains methods for managing
 * the lifecycle of a rendered upload component. <code>add()</code>,
 * <code>dispose()</code>, and <code>display()</code> methods are invoked
 * by corresponding <code>renderAdd()</code>, <code>renderDispose()</code>,
 * <code>renderDisplay()</code>, methods of
 * <code>FileTransfer.Sync.AbstractUploadSelect</code>. Additional
 * <code>send()</code> and <code>cancel()</code> methods are used to control
 * the upload process. "UploadRender" objects allow a particular upload
 * component to use an alternate renderer if necessary, e.g., a Flash-based
 * MultipleUploadSelect can use the default renderer if the Flash plugin is not
 * available.
 */
FileTransfer.Sync.UploadRender = Core.extend({
    
    /**
     * Synchronization peer for file upload component.
     * This property will be available during all method invocations by the peer.
     * @type FileTransfer.Sync.UploadSelect
     */
    peer: null,
    
    /**
     * Flag indicating whether the object has been disposed.
     */
    disposed: false,
    
    $abstract: {

        /**
         * Invoked to inform the renderer to add the component to the DOM.
         * The compnoent should be rendered inside the peer's main DIV, obtainiable via <code>this.peer.div</code>.
         * @see Echo.Render.ComponentSync#renderAdd
         */
        add: function() { },
        
        /**
         * Invoked to inform the renderer that it should cancel the in-progress transfer.
         */
        cancel: function() { },
        
        /**
         * Invoked to inform the renderer that it is being disposed, and should release any
         * resources in use.
         * @see Echo.Render.ComponentSync#renderDispose
         */
        dispose: function() { },
        
        /**
         * Invoked to inform the renderer that is should begin sending the file. 
         */
        send: function() { }
    },
    
    $virtual: {
        
        /** 
         * Invoked by peer when its <code>renderDisplay</code> method is invoked.
         * @see Echo.Render.ComponentSync#renderDisplay
         */ 
        display: null
    }
});

/**
 * Default <code>FileTransfer.Sync.UploadRender</code> implementation.
 */
FileTransfer.Sync.DefaultUploadRender = Core.extend(FileTransfer.Sync.UploadRender, {

    /**
     * The file <code>INPUT</code> element.
     * @type Element
     */
    _fileInput: null,
    
    /**
     * The containing <code>FORM</code> element.
     * @type Element
     */
    _form: null,
    
    /**
     * <code>Monitor</code> to poll server in order to determine upload progress.
     * @type FileTransfer.Sync.Monitor
     */
    _monitor: null,
    
    /**
     * <code>ProgressDisplay.File</code> instance used to provide progress information to <code>ProgressDisplay</code>.
     * 
     * @type FileTransfer.Sync.ProgressDisplay.File
     */
    _progressFile: null,
    
    /** @see FileTransfer.Sync.UploadRender#add */
    add: function() {
        // Render Target IFRAME and form.
        if (Core.Web.Env.BROWSER_INTERNET_EXPLORER  && Core.Web.Env.BROWSER_VERSION_MAJOR < 9) {
            // Target IFRAME must be created using innerHTML for IE or it will not be targeted by the upload form.
            var iframeSrc = "<iframe " +
                    "name=\"" + this.peer.component.renderId + "_target\" " +
                    "src=\"" + this.peer.client.getResourceUrl("Echo", "resource/Blank.html") + "\" " +
                    "scrolling=\"no\" style=\"display:none;\" frameBorder=\"0\" width=\"100\" height=\"30\"></iframe>";
            this.peer.div.innerHTML = iframeSrc;
            // Encoding type must be set on form creation for IE.
            this._form = document.createElement("<form enctype=\"multipart/form-data\"/>");
        } else {
            var iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src = this.peer.client.getResourceUrl("Echo", "resource/Blank.html");
            iframe.id = iframe.name = this.peer.component.renderId + "_target";
            iframe.scrolling = "no";
            iframe.frameBorder = 0;
            iframe.width = 100;
            iframe.height = 30;
            this.peer.div.appendChild(iframe);
            this._form = document.createElement("form");
            this._form.enctype = "multipart/form-data";
        }
        this._form.target = this.peer.component.renderId + "_target";
        
        var action = this.peer.component.get("receiver");
        action += (action.indexOf("?") == -1 ? "?" : "&") + this.peer.urlParameters.join("&");

        this._form.action = action;
        this._form.method = "POST";
        this._form.style.padding = 0;
        this._form.style.margin = 0;
        this.peer.div.appendChild(this._form);

        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.name = this.peer.component.renderId;

        // Basic styling properties
        var component = this.peer.component;
        Echo.Sync.renderComponentDefaults(component, this._fileInput);
        Echo.Sync.Border.render(component.render("border"), this._fileInput);
        Echo.Sync.Insets.render(component.render("insets"), this._fileInput, "margin");
        Echo.Sync.Alignment.render(component.render("alignment"), this._fileInput, true, component);

        this._form.appendChild(this._fileInput);
        
        Core.Web.Event.add(this._fileInput, "change", Core.method(this, function() {
            if (!this._fileInput.value) {
            	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.add exit (!this._fileInput.value)");
                return false;
            }
            this.peer.component.ready();
        }), false);
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.add exit");
    },
    
    /** @see FileTransfer.Sync.UploadRender#cancel */
    cancel: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.cancel enter");
        this._monitor.cancel = true;
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.cancel exit");
    },
    
    /** @see FileTransfer.Sync.UploadRender#dispose */
    dispose: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.dispose enter");
        Core.Web.Event.removeAll(this._fileInput);
        this._form = null;
        this._fileInput = null;
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.dispose exit");
    },
    
    /**
     * <code>Monitor</code> progress update listener.
     * 
     * @param {Object} status the progress status
     * @return true if the progress checking thread should be re-enqueued.
     * @type Boolean
     */
    _progress: function(status) {
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress enter");
        if (this.disposed) {
        	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress exit (this.disposed)");
            return false;
        } else if (status.complete) {
            this.peer.progressDisplay.complete();
            this.peer.component.complete();
        	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress exit (status.complete)");
            return false;
        } else if (status.progress != null) {
            if (!this.peer.progressDisplay.initialized) {
                this._progressFile = new FileTransfer.Sync.ProgressDisplay.File(status.fileName, status.size);
                this.peer.progressDisplay.add(this._progressFile);
                this.peer.progressDisplay.init();
            }
            this._progressFile.progress = status.progress;
            this.peer.progressDisplay.update();
        	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress exit (status.progress != null)");
            return true;
        } else if (status.unknownPid) {
	    Core.Debug.consoleWrite("FU _progress function status is unknownPid");

            // Server hasn't received POST yet.
            if (!this._started) {
		Core.Debug.consoleWrite("FU progress : not started even tho it should have.  Calling start");

                // Start upload if it is not yet started.
                // This is performed here due to bug in Safari which only appears to manifest on 64-bit machines
                // in somewhat unusual and difficult to test conditions.
                this._start();
            }
        	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress exit (!this._started)");
            return true;
        }
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender._progress exit");
    },
    
    /** @see FileTransfer.Sync.UploadRender#send */
    send: function() {
	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.send enter");
        this._fileInput.style.display = "none";
        var url = this.peer.component.get("monitor") || this.peer.component.get("receiver");
        url += (url.indexOf("?") == -1 ? "?" : "&") + this.peer.urlParameters.join("&");
        
    	Core.Debug.consoleWrite("FU DefaultUploadRender.send url = " + url);
    	
        this._monitor = new FileTransfer.Sync.Monitor(url, Core.method(this, this._progress));
        this._monitor.start();
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.send exit");
    },
    
    _start: function() {
	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.start enter");

        this._started = true;
        this._form.submit();
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.start exit");
    }
});

/**
 * Component rendering peer: UploadSelect.
 */
FileTransfer.Sync.UploadSelect = Core.extend(FileTransfer.Sync.AbstractUploadSelect, {

    $load: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.$load enter");
        Echo.Render.registerPeer("FileTransfer.UploadSelect", this);
    	Core.Debug.consoleWrite("FU Sync.DefaultUploadRender.$load exit");
    }
});

/**
 * Runnable to poll server for status of file transfer.
 */
FileTransfer.Sync.Monitor = Core.extend(Core.Web.Scheduler.Runnable, {
    
    /** @see Core.Web.Scheduler.Runnable#timeInterval */
    timeInterval: 500,
    
    /**
     * The URL to poll.
     * @type String
     */
    _monitorUrl: null,
    
    /**
     * Flag indicating whether the upload should be canceled.
     */
    cancel: false,
    
    /**
     * Method to invoke with progress information.
     * The method will be provided with a status object containing
     * progress, size, and complete properties.
     * @type Function
     */
    _onProgress: null,
    
    /**
     * Creates a new <code>Monitor</code>.
     * The provided <code>onProgress</code> method will be invoked with progress updates.
     * It must return a true value in the case that progress updates should continue.  It should
     * return false once the upload has been completed, or if the upload has otherwise been disposed.
     * 
     * @param {String} monitorUrl the URL which will provide progress information
     * @param {Function} onProgress method to invoke with progress status updates 
     */
    $construct: function(monitorUrl, onProgress) {
    	Core.Debug.consoleWrite("FU Sync.Monitor.construct enter");
	    Core.Debug.consoleWrite("FU monitor construction for " + monitorUrl);
        this._monitorUrl = monitorUrl;
        this._onProgress = onProgress;
    	Core.Debug.consoleWrite("FU Sync.Monitor.construct exit");
    },
    
    /**
     * Starts the progress monitor.
     */
    start: function() {
	    Core.Debug.consoleWrite("FU Sync.Monitor.start enter");
        Core.Web.Scheduler.add(this);
    	Core.Debug.consoleWrite("FU Sync.Monitor.start exit");
    },
    
    /** 
     * <code>HttpConnection</code> response listener.
     * 
     * @param e the <code>HttpConnection</code> response event
     */
    _processResponse: function(e) {
    	Core.Debug.consoleWrite("FU Sync.Monitor._processResponse enter");
        var status = {},
            dom,
            s, p, v;

	Core.Debug.consoleWrite("FU processing response with getStatus: " + e.source.getStatus());
        if (e.source.getStatus() != 200) {
        	Core.Debug.consoleWrite("FU Sync.Monitor.run exit (e.source.getStatus() != 200)");
            return;
        }

/*
Causes crashes in Firefox/IE
	Core.Debug.consoleWrite("FU e is : " + e);
	for (var i in e) {
	    Core.Debug.consoleWrite("FU e, " + i + " = " + e[i]);
	}

	Core.Debug.consoleWrite("FU e.source is : " + e.source);
	for (var i in e.source) {
	    Core.Debug.consoleWrite("FU eSource, " + i + " = " + e.source[i]);
	}

	Core.Debug.consoleWrite("FU e.source._xmlHttpRequest is : " + e.source._xmlHttpRequest);
	for (var i in e.source._xmlHttpRequest) {
	    Core.Debug.consoleWrite("FU eSource._xmlHttpRequest, " + i + " = " + e.source._xmlHttpRequest[i]);
	}
*/
	
        s = e.source.getResponseXml().documentElement.getElementsByTagName("s")[0];
	if ((s !=null) && (s != undefined)) {
		Core.Debug.consoleWrite("FU processing reponse with tag name: " + s.tagName);
        
	        p = s.getAttribute("p"); // Progress
		Core.Debug.consoleWrite("FU processing reponse with progress: " + p);
	        if (p) {
	            var data = p.split("/");
	            status.progress = parseInt(data[0], 10);
	            status.size = parseInt(data[1], 10);
	        } else {
	            v = s.getAttribute("v"); // Value
	            Core.Debug.consoleWrite("FU processing reponse with value: " + v);
	            switch (v) {
	            case "complete":
	                status.complete = true;
	                break;
	            case "cancel":
	                status.cancel = true;
	                break;
	            case "unknownpid":
	                status.unknownPid = true;
	                break;
	            }
	        }

		Core.Debug.consoleWrite("FU processing reponse with status: " + status);
		for (var i in status) {
		    Core.Debug.consoleWrite("FU status, " + i + " = " + status[i]);
		}
	
	        if (this._onProgress(status)) {
	            Core.Web.Scheduler.add(this);
	        }
	} else Core.Debug.consoleWrite("FU Response tag missing");
	Core.Debug.consoleWrite("FU Sync.Monitor._processResponse exit");
    },
    
    /** @see Core.Web.Scheduler.Runnable#run */
    run: function() {
	    Core.Debug.consoleWrite("FU Sync.Monitor.run enter");
        var url = this._monitorUrl;
	    Core.Debug.consoleWrite("FU Runnable.run monitor url is: "+ url);

        if (this.cancel) {
  	    Core.Debug.consoleWrite("FU Runnable.run cancel is set");
            url += (url.indexOf("?") == -1 ? "?" : "&") + "command=cancel";
        }
        var conn = new Core.Web.HttpConnection(url, "GET");
        conn.addResponseListener(Core.method(this, this._processResponse));
        conn.connect();
    	Core.Debug.consoleWrite("FU Sync.Monitor.run exit");
    }
});

/**
 * Abstract base class for file upload progress displays.
 * A default implementation is provided by <code>FileTransfer.Sync.DefaultProgressDisplay</code>.
 */
FileTransfer.Sync.ProgressDisplay = Core.extend({
    
    $static: {
        
        /**
         * A representation of a single file which is being uploaded.
         */
        File: Core.extend({
            
            /**
             * The size of the file, in bytes.
             * @type Number 
             */
            size: null,
            
            /**
             * The file name, as determined by the client.
             * @type String
             */
            name: null,
            
            /**
             * The file upload progress (number of bytes uploaded thus far).
             * @type Number
             */
            progress: null,
            
            /**
             * Creates a new <code>File</code>.
             * 
             * @param {String} name the file name
             * @param {Number} size the size of the file, in bytes
             */
            $construct: function(name, size) {
            	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.construct enter");
                this._id = FileTransfer.Sync.ProgressDisplay.File.nextId++;
                this.name = name;
                this.size = size;
                this.progress = 0;
            	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.construct exit");
            }
        }),
        
        /**
         * The upload component.
         * @type Echo.Component
         */
        component: null,
        
        /**
         * The progress display implementation in use.  Will be instantiated by upload components.
         * Must be a a class extending <code>FileTransfer.Sync.ProgressDisplay</code>.
         * @type Function
         */
        implementation: null,
        
        /**
         * Creates a new <code>ProgressDisplay</code> implementation.
         * This method should be invoked by upload components in order to instantiate the progress display implementation.
         * 
         * @param {Echo.Component} component the upload select component
         */
        instantiate: function(component) {
        	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.instantiate enter");
            var impl = new this.implementation();
            impl.component = component;
        	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.instantiate exit");
            return impl;
        }
    },
    
    /**
     * An array of <code>FileTransfer.Sync.ProgressDisplay.File</code> objects being uploaded.
     * On updates the <code>progress</code> property of these files will indicate total progrses.
     */
    files: null,
    
    /**
     * The combined size of all files being uploaded, in bytes.
     */
    totalSize: null,
    
    /**
     * Flag indicating whether the progress display has been initialized, i.e., provided with an
     * initial file set.
     */
    initialized: false,
        
    $abstract: {
        
        /**
         * Notifies the progress display that all uploads have been completed.
         */
        complete: function() { },
        
        /**
         * Creates the progress display, adding it to the parent DOM element.
         * The parent DOM element will be removed from the screen when the upload component is disposed.
         * 
         * @param {Element} parent the parent DOM element
         */
        create: function(parent) { },
        
        /**
         * Disposes of the progress display, removing any attached resources.
         */
        dispose: function() { },

        /**
         * Updates the progress display.
         */
        update: function() { }
    },
    
    add: function(file) {
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.add enter");
        if (this.initialized) {
            throw new Error("Illegal attempt to add files to an initialized progress display."); 
        }
        if (!this.files) {
            this.files = [];
        }
	    Core.Debug.consoleWrite("FU Pushing file: "+ file);
        this.files.push(file);
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.add exit");
    },
    
    /**
     * Determines the current total progress (in bytes) by querying the progress of each individual file whose upload
     * progress is being monitored.
     * 
     * @return the current total progress, in bytes
     * @type Number
     */
    getTotalProgress: function() {
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.getTotalProgress enter");
        var progress = 0;
        for (var i = 0; i < this.files.length; ++i) {
	    Core.Debug.consoleWrite("FU Adding progress from file: "+ i + " which is " + this.files[i].progress);
            progress += this.files[i].progress;
        }
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.getTotalProgress exit");
        return progress;
    },

    /**
     * Initializes the progress display.
     * 
     * @param {Array} files an array of <code>FileTransfer.Sync.ProgressDisplay.File</code> objects; these will be stored
     *        within the progress display object for later use
     */
    init: function() {
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.init enter");
        if (this.intialized) {
            throw new Error("Illegal attempt to initialize a previously initialized progress display.");
        }
        this.initialized = true;
        this.totalSize = 0;
        for (var i = 0; i < this.files.length; ++i) {
            this.totalSize += this.files[i].size;
        }
    	Core.Debug.consoleWrite("FU Sync.ProgressDisplay.init exit");
    }
});

/**
 * The default progress display implementation.
 */
FileTransfer.Sync.DefaultProgressDisplay = Core.extend(FileTransfer.Sync.ProgressDisplay, {
    
    $load: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.$load enter");
        FileTransfer.Sync.ProgressDisplay.implementation = this;  
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.$load exit");      
    },
    
    $static: {
        
        /**
         * Default style properties. 
         */
        DEFAULT_STYLE: {
            border: "1px outset #dfdfdf",
            background: "#dfdfdf",
            foreground: "#000000",
            barBorder: "1px outset #cfcfff",
            barBackground: "#cfcfff",
            barForeground: "#000000"
        }
    },

    /**
     * Style properties.
     */
    style: null,
    
    /**
     * Outer DIV.
     */
    _div: null,
    
    /**
     * Completed progress bar DIV.
     */
    _barDiv: null,
    
    /**
     * The calculated percentage of data which has been uploaded.
     * @type Number
     */
    _percentComplete: null,
    
    /** @see FileTransfer.Sync.DefaultProgressDisplay#complete */
    complete: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.complete enter");
        this._percentComplete = 100;
        this._redraw();
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.complete exit");
    },
    
    /** @see FileTransfer.Sync.DefaultProgressDisplay#complete */
    create: function(parentElement) {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.create enter");
        var style = this.style || {}, defaultStyle = FileTransfer.Sync.DefaultProgressDisplay.DEFAULT_STYLE;
        this._div = document.createElement("div");
        this._div.style.cssText = "position:relative;overflow:hidden;text-align:center;";
        Echo.Sync.Border.render(style.border || defaultStyle.border, this._div);
        Echo.Sync.Color.render(style.background || defaultStyle.background, this._div, "backgroundColor");
        Echo.Sync.Color.render(style.foreground || defaultStyle.foreground, this._div, "color");
                
        if (Core.Web.Env.QUIRK_IE_HAS_LAYOUT) {
            this._div.style.zoom = 1;
        }
        parentElement.appendChild(this._div);
        
        this._barDiv = document.createElement("div");
        this._barDiv.style.cssText = "z-index:1;margin:-1px;position:absolute;top:0;bottom:0;left:0;width:0;";
        Echo.Sync.Border.render(style.barBorder || defaultStyle.barBorder, this._barDiv);
        Echo.Sync.Color.render(style.barBackground || defaultStyle.barBackground, this._barDiv, "backgroundColor");
        Echo.Sync.Color.render(style.barForeground || defaultStyle.barForeground, this._barDiv, "color");
        this._div.appendChild(this._barDiv);

        this._textDiv = document.createElement("div");
        this._textDiv.style.cssText = "z-index:2;position:relative;";
        this._div.appendChild(this._textDiv);

        this._text = document.createTextNode("\u00a0");
        this._textDiv.appendChild(this._text);
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.create exit");
    },
    
    /** @see FileTransfer.Sync.DefaultProgressDisplay#complete */
    dispose: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.dispose enter");
        this._barDiv = null;
        this._div = null;
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.dispose exit");
    },
    
    /**
     * Redraws the current state of the component based on the value of the <code>_percentComplete</code> property
     */
    _redraw: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay._redraw enter with percentComplete " + this._percentComplete);
        this._barDiv.style.width = this._percentComplete + "%";
        this._text.nodeValue = this._percentComplete + "%";
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay._redraw exit");
    },

    /** @see FileTransfer.Sync.DefaultProgressDisplay#complete */
    update: function() {
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.update enter");
        this._percentComplete = Math.round((100 * this.getTotalProgress()) / this.totalSize);
        Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.update percentComplete is " + this._percentComplete);
        this._redraw();
    	Core.Debug.consoleWrite("FU Sync.DefaultProgressDisplay.update exit");
    }
});
