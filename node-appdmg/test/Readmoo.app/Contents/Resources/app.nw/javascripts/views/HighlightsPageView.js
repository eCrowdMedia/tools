var Backbone = require('backbone');

var HighlightsListView = require('./HighlightsListView.js');
var MyHighlightsCollection = require('../collections/MyHighlightsCollection.js');

var oAuth = require('../oAuth.js');

var HighlightsPageView = Backbone.View.extend({
    el: '[data-role=page].highlights',

    initialize: function(){
    	oAuth.getMyHighlights().done(function(highlights){
    		var myHighlightsCollection = new MyHighlightsCollection(highlights.items);
    		var pagination = (highlights.pagination) ? highlights.pagination : null ;
    		var myHighlightsListView = new HighlightsListView({collection: myHighlightsCollection, pagination: pagination, type: 'my-highlights'});
    	});
    },

    render: function(){

      return this;
    }
});

module.exports = HighlightsPageView;
