

var BookShelfPageView = Backbone.View.extend({

  // template: _.template('<li>bookshelf_1</li>'),
  el: '.mybooklist',

  tags: $.parseJSON(window.localStorage.getItem('-nw-tags')),

  initialize: function(){
    // var tags = _.uniq(this.collection.pluck('tags')),
    /*var type = [],
        length =[],
        privateBooks = 0,
        archiveBooks = 0,
        bookshelfCollection = new Backbone.Collection();

    this.bookshelfCollection = bookshelfCollection;*/

    /*for (var i = 0; i< tags.length; i++){
      type[i] = this.collection.where({tags: tags[i]});
      length[i] = type[i].length;
      if (tags[i] === null) {
        tags[i] = '未分類';
      }
    }

    this.collection.each(function(model){
      if (model.get('library_item').private == true) {
        privateBooks+=1;
      } else if (model.get('action') == 'archive') {
        archiveBooks+=1;
      }
    });

    tags.unshift('私密書籍');
    length.unshift(privateBooks);
    tags.unshift('全部書籍');
    length.unshift(this.collection.length - (privateBooks + archiveBooks));

    this.config = {data:[]};
    console.log('tags length: ' + tags.length);

    for (var j = 0; j< tags.length; j++) {

      // console.log('tags: ' + tags[j]);
      this.config.data[j] = {
        tag: tags[j],
        length: tags[j] == '未分類' ? length[j] - (archiveBooks) : length[j]
      };
      bookshelfCollection.add(this.config.data[j]);
    }*/

    // this.config = { data: [{tag: tags[0], length: length[0]}, {tag: tags[1], length: length[1]}]};
    // console.log('config : ' + JSON.stringify(this.config));
    // window.App.Vent.trigger('filter');
  },

  // 每次點擊格式、條列，就會被 nwAppRouter 觸發一次 render，也就會清空書櫃分類，再重新產生一次，須檢討效能及必要性
  render: function(){
    var bookshelfItemCollection =  window.App.BookshelfItemCollection,
        that = this;

    // 清空書櫃分類
    this.$el.empty();

    // 重新產生一次書櫃分類
    var appendView = function(){
      if (bookshelfItemCollection) {
        bookshelfItemCollection.each(function(model){
          // console.log('tag model: '+ JSON.stringify(model));
          var tag = model.get('tag');
          if (tag.id !== 'archive') {
            if (tag.id == 'x')// 不顯示限制級書櫃，歸屬未分類
              return;
            var bookShelfItemView = new BookShelfItemView({model: model});
            that.$el.append(bookShelfItemView.render().el);
          }
        });
      }
    };

    appendView();
    // this.$el.html(temp(this.config));
    // this.$el.append('<div class="add_shelf"><img src="images/plus_icon.png"/>新增書櫃</div>');
  }

});
