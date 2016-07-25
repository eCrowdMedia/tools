var Backbone = require('backbone');

var InitView = Backbone.View.extend({
	el: '.init-message',

	initialize: function(){
		this.render();
		this.model.on('change', function(model){
			this.$el.text(model.get('message'));
			this.$el.fadeOut();
		}, this);
	},

	render: function(){
		this.$el.text(this.model.get('message'));
		return this;
	}
});

module.exports = InitView;