var Backbone = require('backbone');

var PageModel = Backbone.Model.extend({
	defaults: {
		activePage: null
	}
});

module.exports = PageModel;