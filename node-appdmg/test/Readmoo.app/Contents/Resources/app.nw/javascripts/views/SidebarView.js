var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

Backbone.$ = $;

var SidebarView = Backbone.View.extend({
	initialize: function(){
		this.render();
	},

	el: '.user-profile-container',

	template: require('../templates/user_profile.hbs'),

	render: function(){
		console.log(this.model);
		window.console.log((this.model.get('userProfile')));
		var temp = this.template((this.model.get('userProfile')) );
		window.console.log(temp);
		this.$el.empty().append(temp);
		return this;
	}
});

module.exports = SidebarView;