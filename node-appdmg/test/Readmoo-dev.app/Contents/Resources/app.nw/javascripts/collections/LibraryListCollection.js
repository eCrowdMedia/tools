var $ = require('jquery');
var underscore = require('underscore');
var Backbone = require('backbone');

var LibraryItemModel = require('../models/LibraryItemModel.js');

Backbone.$ = $;

var LibraryListCollection = Backbone.Collection.extend({
	model : LibraryItemModel
});

module.exports = LibraryListCollection;