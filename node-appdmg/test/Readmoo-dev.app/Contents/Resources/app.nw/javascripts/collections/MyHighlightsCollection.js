var $ = require('jquery');
var underscore = require('underscore');
var Backbone = require('backbone');

var MyHighlightModel = require('../models/MyHighlightModel.js');

Backbone.$ = $;

var MyHighglightsCollection = Backbone.Collection.extend({
	model : MyHighlightModel
});

module.exports = MyHighglightsCollection;