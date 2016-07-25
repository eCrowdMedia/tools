var $ = require('jquery');

var _ = require('underscore');
var Backbone = require('backbone');
var Handlebars = require('handlebars');
var request = require('request');
var path = require('path');

var oAuth = require('../oAuth.js');
var Utils = require('../Utils.js');

var MenuItemView = Backbone.View.extend({
  initialize: function(options){
    // window.App.Vent.on('menuChange', function(menuItemName){
    //   if (menuItemName === this.model.get('name')){

    //   }
    // }, this);
  },

  events: {
    'click': 'active'
  },

  active: function(){
    if (this.$el.attr('data-state') === 'active'){
      return;
    }else{
      this.$el.attr('data-state', 'active');
      this.$el.siblings().attr('data-state', '');
      var menuItemName = this.$el.attr('data-name');
      window.App.Vent.trigger('menuChange', menuItemName);
    }
  },

  template: require('../templates/menu_item.hbs'),

  render: function(){
    this.setElement(this.template(this.model.attributes));

    return this;
  }
});

module.exports = MenuItemView;
