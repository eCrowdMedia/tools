
var LibraryListView = Backbone.View.extend({
  initialize: function(){
    // window.console.log(this.collection);
    this.setElement(window.document.querySelectorAll('.library-list-container'));
    this.$el.empty();
    console.log('libraryListView initialize.');
    if (this.collection.length > 1)
      this.sortBy('touched_at');
    this.render();

    window.App.Vent.on('filter', this.filter, this);
    // window.App.Vent.on('search', this.search, this);
    window.App.Vent.on('sort', this.sortBy, this);
    // this.collection.on('change', this.saveToLocalStorage, this);
  },
  // saveToLocalStorage: function(){
  //   window.localStorage.setItem('-nw-library', window.JSON.stringify(this.collection.toJSON()));
  // },
  sortBy: function(key){
    this.collection.comparator = function(model){
      switch(key){
        case 'id':
          return - model.get('library_item')[key];
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

    var redraw = $('#list').data('action');
    if (redraw == 'enable') {
      console.log('list render');
      this.render();
    }

  },
  search: function(keyword){
    // console.log('list search!');
     $.force_appear();
     setTimeout(function(){
      $('#list-search-style').text('.library-list-item:not([data-search*='+keyword+']){display:none}');
      $.force_appear();
    }, 300);
  },
  filter: function(option){
    var optClass = option.optClass.split(' ');
    if (optClass == 'whole' || optClass == '18x' || optClass == 'private' || optClass == 'marathon')
      $('#list-filter-style').text('.library-list-item:not([data-'+option.optClass+'='+option.key+']){display:none}');
    else if (optClass == 'tags') {
      if (!isNaN(option.key)){
        var foo = option.key;
        option.key = '"' + foo.toString() + '"';
      }
      // 2016/05/12 配合一本書可以對應多個書櫃，調整 CSS Attribute Selectors
      $('#list-filter-style').text('.library-list-item:not([data-'+option.optClass+'*="'+option.key+'"]){display:none}');
    } else {
      $('#list-filter-style').text('.library-list-item:not([data-'+option.optClass+'*="'+option.key+'"]){display:none}');
    }
  },
  render: function(){
    var that = this,
        length = this.collection.length;
    console.log('library_listview render.');
    // console.log(this.$el);
    this.$el.empty();
    $.force_appear();
    var count = this.collection.length;
    if (count > 0) {
      this.collection.each(function(model){

        /*var library_item = _.omit(model.get('library_item'));

        if (library_item.reading){
          library_item.reading.progress = library_item.reading.progress * 100;
          model.set('library_item', library_item);
        }*/

        // console.log('0415 :' + JSON.stringify(progress.reading.progress));
        /*if(progress)
          model.set('library_item')['reading']['progress']*/
        length -= 1;
        if (length == 1)
          window.App.$loadbook.css('display', 'none');
        var libraryItemView = new BookItemView({model: model, type: 'list'});
        that.$el.append(libraryItemView.render().el);
      },this);

      App.$loadbook.removeClass('show');
      // 2016/04/28 此處錯誤，但是若修正，會造成書櫃開啟是顯示「條列」，先將錯就錯，以後再修
      $('.library-grid-container').fadeIn();
      // $('.library-list-container').fadeIn();
      if (this.collection.length %2 !== 0 && this.collection.length > 1){
        var doc = document.createElement('li');
        doc.setAttribute('class','library-list-item');
        doc.innerHTML = '<div class="book-container"></div>';
        this.$el.append(doc);
      }
    } else {
      //TODO check user's account to make sure real books in this account.
      window.App.$loadbook.css('display', 'none');
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
