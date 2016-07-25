var $ = require('jquery');
var underscore = require('underscore');
var Backbone = require('backbone');

var MenuItemModel = require('../models/MenuItemModel.js');

Backbone.$ = $;

var MenuListCollection = Backbone.Collection.extend({
	model : MenuItemModel
});

module.exports = MenuListCollection;