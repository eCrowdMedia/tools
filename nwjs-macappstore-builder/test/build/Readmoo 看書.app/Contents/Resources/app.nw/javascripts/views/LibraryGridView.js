
var LibraryGridView = Backbone.View.extend({

  initialize: function(){
    // window.console.log(this.collection);
    this.setElement(window.document.querySelectorAll('.library-grid-container'));
    // this.$el.empty();
    console.log('libraryGridView initialize.');
    if (this.collection.length > 1)
      this.sortBy('touched_at');

    this.render();
    window.App.Vent.on('search', this.search, this);
    window.App.Vent.on('filter', this.filter, this);
    window.App.Vent.on('sort', this.sortBy, this);
    // this.collection.on('change', this.saveToLocalStorage, this);
    this.$gridStyle = $('#grid-search-style');
  },

  sortBy: function(key){
    this.collection.comparator = function(model){
      switch(key){
        case 'id':
          if (model.get('library_item')){
            return - model.get('library_item')[key];
          }
          break;
        case 'touched_at':
          if (model.get('library_item')){
            if (model.get('library_item')['reading']){
              var dateString = model.get('library_item')['reading']['touched_at'];
              var d = new Date(dateString);
              return - d.getTime();
            }
          }
          break;
      }
    };

    this.collection.sort();

    var redraw = $('#grid').data('action');
    if (redraw == 'enable') {
      console.log('grid render');

      this.render();
    }
  },

  // saveToLocalStorage: function(){
  //   // console.log(this.collection.toJSON());
  //   window.localStorage.setItem('-nw-library', window.JSON.stringify(this.collection.toJSON()));
  // },

  filter: function(option){
    var optClass = option.optClass.split(' ');
    // console.log('optClass: ' + optClass);
    if (optClass == 'whole' || optClass == '18x' || optClass == 'private' || optClass == 'marathon') {
      // console.error('option.key: ' + isNaN(option.key));

      this.$gridStyle.text('.library-grid-item:not([data-'+optClass+'='+option.key+']){display:none}');
    } else if (optClass == 'tags') {
      if (!isNaN(option.key)){
        var foo = option.key;
        option.key = '"' + foo.toString() + '"';
      }
      // 2016/05/12 配合一本書可以對應多個書櫃，調整 CSS Attribute Selectors
      this.$gridStyle.text('.library-grid-item:not([data-'+optClass+'*="'+option.key+'"]){display:none}');
    } else {
      this.$gridStyle.text('.library-grid-item:not([data-'+optClass+'*="'+option.key+'"]){display:none}');
    }
  },

  search: function(keyword){
    // console.log('grid view search!');
    $.force_appear();
    this.$gridStyle.text('.library-grid-item:not([data-search*='+keyword+']){display:none}');
    setTimeout(function(){
      $.force_appear();
    }, 300);
  },

  render: function(){
    var that = this,
        length = this.collection.length;
    console.log('library_grid_view render.');
    // console.log(this.$el);
    this.$el.empty();
    $.force_appear();
    var count = this.collection.length;
    if (count > 0) {
      this.collection.each(function(model){
        // console.log('model action: ' + model.get('action'));
        var libraryItemView = new BookItemView({model: model, type: 'grid'});
        that.$el.append(libraryItemView.render().el);
        length -= 1;
        if (length == 1)
          window.App.$loadbook.css('display', 'none');
      },this);
      App.$loadbook.removeClass('show');
      $('.library-grid-container').fadeIn();
    } else {
      App.$loadbook.removeClass('show');
      this.$el.append('<div class="noBooks"><p>抱歉，您的書櫃裡面還沒有電子書<br/>請先至網站領取免費書<p><span class="freebooks">領書</span></div>');
    }
    $('.freebooks').on('click', function(){
        if (navigator.onLine){
          gui.Shell.openExternal('https://store.readmoo.com/search/free');
        } else {
          nwNotify.notify('目前網路狀態為離線，本服務需要網路連線才能使用！', '');
        }
      });
  }
});
