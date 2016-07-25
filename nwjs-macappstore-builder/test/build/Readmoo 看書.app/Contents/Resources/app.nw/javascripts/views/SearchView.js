var SearchView = Backbone.View.extend({
  el: '.searchbar',

  events: {
    'input input': 'search',
    'click .search': 'dialog',
    'click .cancel': 'finish',
    'blur input': 'finish'
  },

  $gridStyle: $('#grid-search-style'),

  $listStyle: $('#list-search-style'),

  $input: $('input[type=search]'),

  $grid: undefined,

  $list: undefined,

  gridcache: [],

  listcache: [],

  initialize: function(){
    this.listenTo(this.model, 'change:keyword', this.render);
    this.$el.find('.cancel').css({display:'none'});
  },

  dialog: function(event){
    event.preventDefault();
   /* this.$gridStyle.text('.library-grid-item:not([data-search*='+'想找什麼書？'+']){display:none}');
    this.$listStyle.text('.library-list-item:not([data-search*='+'想找什麼書？'+']){display:none}');*/
    this.$input.animate({"width": "220px", "opacity": 1});
    this.$el.find('.search').css({display:'none'});
    this.$el.find('.cancel').css({display:'block'});
    this.$input.focus();
  },

  finish: function(event){
    event.preventDefault();
    console.log('finish');
    // console.log('search: ' + this.$el.find('input').val());
    var text = this.$el.find('input').val();
    if (text === '') {
      this.$input.animate({"width": "0px", "opacity": 0});
      this.$gridStyle.text('');
      this.$listStyle.text('');
      this.$el.find('input').val('');
    }
    this.$el.find('.search').css({display:'block'});
    this.$el.find('.cancel').css({display:'none'});
  },

  gridCache: function(){
    var grid = $('.library-grid-item');
    var buffer = [];
    this.$grid = $('#grid');
    grid.each(function(){
      buffer.push({
        element: this,
        text: $(this).data('search') ? $(this).data('search').trim().toLowerCase() : ''
      });
    });
    this.gridcache = buffer;
  },

  listCache: function(){
    var list = $('.library-list-item');
    var buffer = [];
    this.list = $('#list');
    list.each(function(){
      buffer.push({
        element: this,
        text: $(this).data('search') ? $(this).data('search').trim().toLowerCase() : ''
      });
    });
    this.listcache = buffer;
  },

  search: function(e){
    var searching = _.debounce(function(){
      var keyword = $(e.target).val().toLowerCase();
      // if (this.$grid.data('action') == 'enable'){
        this.gridcache.forEach(function(Item){
          var index = 0;
          if (keyword){
            index = Item.text.indexOf(keyword);
          }
          // 如果包含關鍵字，就顯示
          Item.element.style.display = index === -1 ? 'none' : '';
        });
      // } else {
         this.listcache.forEach(function(Item){
          var index = 0;
          if (keyword){
            index = Item.text.indexOf(keyword);
          }
          Item.element.style.display = index === -1 ? 'none' : '';
        });
      // }
      setTimeout(function(){
        $.force_appear();
      }, 50);
    }.bind(this), 300);

    searching();

    // this.model.set('keyword', keyword);
  },

  render: function(){
    window.App.Vent.trigger('search', this.model.get('keyword'));
  }
});
