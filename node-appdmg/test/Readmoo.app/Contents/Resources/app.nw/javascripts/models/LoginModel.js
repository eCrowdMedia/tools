var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var gui = window.require('nw.gui');

var lsGet = function(key){
	return gui.Window.get().window.localStorage.getItem(key);
};

var LoginModel = Backbone.Model.extend({
	defaults: {
		udid: lsGet('-nw-udid') || '123456',
		accessToken: lsGet('-nw-access_token') || null,
		userId: lsGet('-nw-userid') || null,
		userProfile: $.parseJSON(lsGet('-nw-'+lsGet('-nw-userid')+'-userprofile')) || null,
		privateKey: lsGet('privateKey') || null
	},
	getFromLocalStorage: function(){
		this.set('udid', lsGet('-nw-udid'));
		this.set('accessToken', lsGet('-nw-access_token'));
		this.set('userId', lsGet('-nw-userid'));
		this.set('userProfile', $.parseJSON(lsGet('-nw-'+lsGet('-nw-userid')+'-userprofile')));
		this.set('privateKey', lsGet('privateKey'));
	}
});

module.exports = LoginModel;