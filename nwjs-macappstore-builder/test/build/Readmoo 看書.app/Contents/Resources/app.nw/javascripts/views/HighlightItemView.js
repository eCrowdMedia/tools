var $ = require('jquery');
var underscore = require('underscore');
var Backbone = require('backbone');
var Handlebars = require('handlebars');

Backbone.$ = $;

var HighlightsItemView = Backbone.View.extend({

	initialize: function(){
		// window.console.log(this.collection);
		
	},

	template: require('../templates/highlight_item.hbs'),

	render: function(){
		var temp = this.template(this.model.attributes);
		this.setElement(temp);
		return this;
	}
});

module.exports = HighlightsItemView;