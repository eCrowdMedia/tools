var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var oAuth = require('../oAuth.js');
var request = require('request');
var gui = window.require('nw.gui');
var forge = require('node-forge');
var pki = forge.pki;
var rsa = pki.rsa;

var mainWindow = gui.Window.get();

Backbone.$ = $;

var LoginView = Backbone.View.extend({
    initialize: function(){
        window.localStorage.setItem('-nw-udid', this.model.get('udid'));
     //    this.model.on('change:udid', function(){
     //        console.log('change:udid');
     //        console.log(this.model.get('udid'));
     //        if (this.model.get('udid')){
     //            window.localStorage.setItem('-nw-udid', this.model.get('udid'));
     //            console.log(window.localStorage.getItem('-nw-udid'));
     //        this.getToken();
     //        }
    	// } ,this);
    	this.model.on('change:accessToken', function(){
            console.log('change:accessToken');
            if (this.model.get('accessToken')){
                window.localStorage.setItem('-nw-access_token', this.model.get('accessToken'));
                this.getMe(this.model.get('accessToken'));
            }
    	}, this);
    	this.model.on('change:userId', function(){
            console.log('change:userId');
            if (this.model.get('userId')){
                window.localStorage.setItem('-nw-userid', this.model.get('userId'));
                this.registerKpu();
            }
    	}, this);
    	this.model.on('change:userProfile', function(){
            console.log('change:userProfile');
            var userProfile = this.model.get('userProfile');
            if (this.model.get('userId')){
                if (typeof userProfile === 'string'){
                    window.localStorage.setItem('-nw-'+this.model.get('userId')+'-userprofile', userProfile );
                }else{
                    window.localStorage.setItem('-nw-'+this.model.get('userId')+'-userprofile', JSON.stringify(userProfile) );
                }
            }
    	}, this);
    	this.model.on('change:privateKey', function(){
            console.log('change:privateKey');
            if (this.model.get('privateKey')){
                window.localStorage.setItem('-nw-'+this.model.get('userId')+'-kpr', this.model.get('privateKey'));
                window.localStorage.setItem('rsa_privateKey', this.model.get('privateKey'));
                this.checkLogin();
            }
    	}, this);

    	if (!this.checkLogin()){
            this.getToken();
            window.App.Vent.trigger('notlogin');
    	}
    },

    el: '[data-role=page].logout',

    Vent: _.extend({}, Backbone.Events),

    checkLogin: function(){
    	if (this.checkUDID() && this.checkToken() && this.checkUserId() && this.checkUserProfile() && this.checkKpr()){
            console.log('logged in.');
            window.App.Vent.trigger('login');
            return true;
    	} else {
    		console.log('not logged in.');
    		return false;
    	}
    },

    setUDID: function(){
    	this.model.set('udid', '123456');
    	return this;
    },
    checkUDID: function(){
    	var udid = window.localStorage.getItem('-nw-udid');

		if (udid && udid === this.model.get('udid')) {
			console.log('udid y');
            return udid;
		} else {
            console.log('no udid.');
			return false;
		}
    },
    checkToken: function(){
    	var token = window.localStorage.getItem('-nw-access_token');
    	if (token && token === this.model.get('accessToken')){
            console.log('token y');
            return token;
    	} else {
            console.log('no access token.');
            return false;
    	}
    },
    checkUserId: function(){
        var userId = window.localStorage.getItem('-nw-userid');
        if (userId && userId === this.model.get('userId')) {
            console.log('userid y');
            return userId;
        } else {
            console.log('no userid.');
            return false;
        }
    },
    checkUserProfile: function(){
        var userId = window.localStorage.getItem('-nw-userid');
        if (userId) {
            var userProfile = window.localStorage.getItem('-nw-'+userId+'-userprofile');
            console.log(userProfile);
            if (userProfile && userProfile === JSON.stringify(this.model.get('userProfile'))){
                console.log('userprofile y');
                return userProfile;
            } else {
                console.log('no userprofile.');
                return false;
            }
        }

    },
    getToken: function(){
    	var that = this;
        console.log('getToken');
        mainWindow.on('document-start', function(){
            console.log('document-start');
            if(!window.localStorage.getItem('-nw-udid')){
                window.localStorage.setItem('-nw-udid','123456');
            }
            if (window.location.hash){
                mainWindow.removeAllListeners('document-start');
                var token = window.location.hash.split("=")[1].split('&')[0];
                that.model.set('accessToken', token);
            }
        });
        window.location = oAuth.oAuthInfo.url();
        console.log(window);
        console.log(oAuth.oAuthInfo.url());
        // var $loginFrame = this.$el.find('.login-frame');
        // console.log(oAuth.oAuthInfo.url());
        // console.log(window.localStorage.getItem('-nw-udid'));
        // $loginFrame.attr('src', oAuth.oAuthInfo.url());
        // mainWindow.on('document-start', function(frame){
        //     console.log('document-start');
        //     if(!window.localStorage.getItem('-nw-udid')){
        //         window.localStorage.setItem('-nw-udid','123456');
        //     }
        //     url = frame.contentWindow.location;
        //     console.log(url);
        //     if (url.hash){
        //         var token = url.hash.split("=")[1].split('&')[0];
        //         that.model.set('accessToken', token);
        //         // this.close();
        //     } else{
        //         console.log('please log in.');
        //     }
        // });
    },
    getMe: function(token){
    	console.log('getMe');
    	var that = this;
    	var url = 'https://api.readmoo.com/me?access_token='+token;
    	var options = {
    		url: url,
    		headers: {
    			Authorization : 'Client '+ oAuth.oAuthInfo.client_id
    		}
    	};
    	request(options, function(error, response, body){
    		if (!error && response.statusCode == 200) {
    	    	var userProfile = $.parseJSON(body);
                console.log(userProfile);
    	    	that.model.set('userId', userProfile.user.id);
                that.model.set('userProfile', userProfile.user);
    	    	// events.trigger('get_me_done' ,userProfile.user) ;
    	  	}
    	});
    },
    checkKpr: function(){
    	var userId = window.localStorage.getItem('-nw-userid');
    	var Kpr = window.localStorage.getItem('-nw-'+userId+'-kpr');
    	if (Kpr === this.model.get('privateKey')){
            console.log('kpr y');
    		return Kpr;
    	}else{
            console.log('no kpr.');
    		return false;
    	}
    },
    registerKpu: function(){
    	var that = this;
    	var keypair = rsa.generateKeyPair(1024);
        var kpu_pem = pki.publicKeyToPem(keypair.publicKey);
        var kpr_pem = pki.privateKeyToPem(keypair.privateKey);
    	oAuth.publicKey(this.model.get('userId'), this.model.get('accessToken'), kpu_pem, this.model)
    		.done(function(){
    			that.model.set('privateKey', kpr_pem);
    		});
    },

    logout: function(){
        var url = oAuth.logout();
        console.log('logoutUrl',url);
        window.location = url;
        // var $loginFrame = this.$el.find('.login-frame');
        // $loginFrame.attr('src', url);
    },

    render: function(){

      return this;
    }
});

module.exports = LoginView;
