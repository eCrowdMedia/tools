var $ = require('jquery');
var underscore = require('underscore');
var Backbone = require('backbone');
var Handlebars = require('handlebars');
var request = require('request');
var oAuth = require('../oAuth.js');

var HighlightItemView = require('./HighlightItemView.js');

Backbone.$ = $;

var HighlightsListView = Backbone.View.extend({
	
	events: {
		'click .more': 'loadMore'
	},

	initialize: function(options){
		this.pagination = options.pagination;
		this.type = options.type;
		this.setElement(this.elementSelector());
		if(this.pagination){
			this.$el.find('.more').attr('data-more', this.pagination.next).show();
		}
		this.collection.on('add', this.render, this);
		this.render();
	},

	elementSelector: function(){
		return '.'+this.type+'-container';
	},

	loadMore: function(event){
		var that = this;
		var url = $(event.target).attr('data-more');
		oAuth.getMoreHighlights(url).done(function(highlights){
			that.collection.add(highlights.items);
		});
	},

	render: function(){
		var that = this;
		var $highlightList = this.$el.find('.highlights-list');
		$highlightList.empty();
		this.collection.each(function(model){
			var highlightItemView = new HighlightItemView({model: model});
			$highlightList.append(highlightItemView.render().el);
		},this);
		return this;
	}
});

module.exports = HighlightsListView;