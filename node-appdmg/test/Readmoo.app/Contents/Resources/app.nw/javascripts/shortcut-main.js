var gui = window.require('nw.gui');
var win = gui.Window.get(); // main window
win.on('close', function(){
	if (win !== null){
		win.close(true);
		win = null;
	}
});

var sc_quit = {
  key : "Ctrl+Q",
  active : function() {
    gui.App.closeAllWindows();
    console.log("Global desktop keyboard shortcut: " + this.key + " active."); 
  },
  failed : function(msg) {
    // :(, fail to register the |key| or couldn't parse the |key|.
    console.log(msg);
  }
};

var scQuit = new gui.Shortcut(sc_quit);

var sc_close = {
	key: "Ctrl+W",
	active: function() {
		win.close();
	},
	failed: function(msg) {
		console.log(msg)
	}
};

var scClose = new gui.Shortcut(sc_close);

var sc_reload = {
	key: "Ctrl+R",
	active: function() {
		var win = gui.Window.get();
		win.reloadIgnoringCache();
		console.log("Global desktop keyboard shortcut: " + this.key + " active."); 
	},
	failed: function(msg) {
		console.log(msg);
	}
};

var scReload = new gui.Shortcut(sc_reload);

win.on('focus', function(){
	gui.App.registerGlobalHotKey(scClose);
	gui.App.registerGlobalHotKey(scQuit);
	gui.App.registerGlobalHotKey(scReload);
});

win.on('blur', function(){
	gui.App.unregisterGlobalHotKey(scClose);
	gui.App.unregisterGlobalHotKey(scQuit);
	gui.App.unregisterGlobalHotKey(scReload);
});

module.exports = null;