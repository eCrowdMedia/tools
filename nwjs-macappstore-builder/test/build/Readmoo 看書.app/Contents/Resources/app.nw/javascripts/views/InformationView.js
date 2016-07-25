
var nwNotify = require('nw-notify');

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
      defaultStyleText: {
          color: '#FF000',
          fontWeight: 'bold'
      }
});

var InformationView = Backbone.View.extend({
  el: '.information',

  initialize: function(){
    // this.collection.on('change', this.render, this);
    // console.log(this.model.toJSON());
    this.model.on('change:activePage', this.render, this);
    // console.log('client_id: ' + this.model.get('client_id'));
  },

  events: {
    'click #number': 'showMessage',
    'click #circle': 'showMessage',
    'click': 'showMessage'
  },

  showMessage: function(){
    // nwNotify.notify('此功能尚未完成，敬請期待！', '');
    console.log('showMessage!');
    //TODO
  },

  render: function(){
    return this;
  }

});
