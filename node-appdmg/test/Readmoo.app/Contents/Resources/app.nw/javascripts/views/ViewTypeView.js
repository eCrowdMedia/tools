
var ViewTypeView = Backbone.View.extend({

  el: '.view-type',

  initialize: function(options) {
    // window.App.Vent.on('menuChange', function(menuItemName){
    //   if (menuItemName === this.model.get('name')){

    //   }
    // }, this);
  },

  events: {
   'click #grid': 'grid',
   'click #list': 'list',
  },

  grid: function(event, data) {
     this.model.set({'grid':'enable','list':'disable'});
     window.nwApp.navigate("grid" , {trigger: true});
     var target = event.target,
         $target = $(target);
     $target.siblings().attr('data-action','disable').data('action', 'disable');
     $target.attr('data-action','enable').data('action','enable');

     /*this.$finish.on('click', function(){
       that.model.set({'grid':'enable','list':'disable'});
       window.nwApp.navigate("grid", {trigger: true});
     });*/
  },

  list: function(event, data) {
     this.model.set({'grid':'disable','list':'enable'});
     window.nwApp.navigate("list" , {trigger: true});
     var target = event.target,
         $target = $(target);
     $target.siblings().attr('data-action','disable').data('action', 'disable');
     $target.attr('data-action','enable');
     $target.data('action','enable');

     /*this.$finish.on('click', function(){
       that.model.set({'grid':'disable','list':'enable'});
       window.nwApp.navigate("list", {trigger: true});
     });*/
  },

  template: require('./javascripts/templates/view_type.hbs'),

  render: function() {
    var typeTemplate = this.template(this.model.attributes)
    // var typeTemplate = temp_type(this.model.attributes);
    $('.view-type').empty().append(typeTemplate);
    return this;
  }
});
