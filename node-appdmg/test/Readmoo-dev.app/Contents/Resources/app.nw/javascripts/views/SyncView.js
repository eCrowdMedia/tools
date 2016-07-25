
var SyncView = Backbone.View.extend({

  // template: _.template('<li>bookshelf_1</li>'),
  // el: '.main-content',
  circle: null,

  initialize: function(){
    this.render();
  },

  events: {
    // 'click li' : 'doClick'
  },

  drawProgress: function(result){
    this.circle.animate(result,{
      from: {color: '#ddd'},
        to: {color: '#ddd'}
    });
  },

  render: function(){
    // var temp = require('./javascripts/templates/sync.hbs');
    // $('.menu-item[data-name=library]').append(this.el);
    this.$el.html('<div class="sync-progress"><div class="plate"></div><div class="loading_books">同步個人書櫃資料中...</div></div>');
    // this.$el.append('<div class="add_shelf"><img src="images/plus_icon.png"/>新增書櫃</div>');
    this.circle = new ProgressBar.Circle(this.$el.find('.loading_books')[0], {
      duration: 800,
      color: "#00A0E8",
      trailColor: "#ddd",
      trailWidth: 1,
      strokeWidth: 6,
      easing: 'easeInOut',
      text: {
        value: '0'
      },
      step: function(state, bar) {
          bar.setText((bar.value() * 100).toFixed(0) + '%');
      }
    });
    $('.main-content').prepend(this.el);
  }

});
