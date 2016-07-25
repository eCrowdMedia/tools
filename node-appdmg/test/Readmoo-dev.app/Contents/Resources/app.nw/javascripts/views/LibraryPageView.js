var pkg = require('./package.json');

var LibraryPageView = Backbone.View.extend({

  // el: '[data-role=page].library',
 /* el: '<div class="library" data-role="page" data-state=""><ol class="library-grid-container"></ol>' +
      '<ol class="library-grid-container"></ol></div>',*/

  library: $.parseJSON(window.localStorage.getItem('-nw-library')),

  initialize: function(){
      console.log('librarypageview init');
      var that = this;
      window.coverDownloading = 0;
      // console.log(this.el);
      // console.log( '0324 check:' + this.$el);
      /*if (library){
          that.render(library);
      }else{
          alert('fetch from getMeLibraryCompare!');
          oAuth.().done(that.render);
      }*/
  },

  // template: require('./javascripts/templates/library_page.hbs'),

/*
  checkCovers: function(libraryCollection){ //deprecated api

    var win_path = pkg.internal == 'no' ? 'C:\\Readmoo\\api\\cover\\' : 'C:\\Readmoo-dev\\api\\cover\\',
    dtd = $.Deferred(),
    coverDest = undefined,
    bookId = undefined,
    reqUrl = undefined,
    that = this,
    total = libraryCollection.length;
    console.log('cover total: ' + window.coverDownloading);

    if (!fs.existsSync(window.App.pathCover) && platform ==='darwin') {
      fs.mkdir(window.App.pathCover);
    } else if (!fs.existsSync(win_path) && platform !== 'darwin') {
      fse.mkdirs(win_path, function(err){
      if (err)
        console.log('error');
      else
        console.log('success create cover folder');
      });
    }

    //TODO download anmiation start

    libraryCollection.each(function(model){
      window.coverDownloading += 1;
      console.log('url: ' + model.get('library_item').book.cover_url);
      reqUrl = model.get('library_item').book.cover_url
      bookId = model.get('library_item').book.id
      coverDest = platform === 'darwin' ? window.App.pathCover + bookId + '.jpg' : win_path + bookId + '.jpg';
      if (window.coverDownloading >=10)
        dtd.resolve();
    });

    return dtd.promise();
  },
*/
  checkCoverExist: function(coverDest){
    return fs.existsSync(coverDest);
  },

  render: function(){
      /*var temp = this.template({});
          this.setElement(temp);*/
      // console.log('0410 pageview template: ' + this.template);
      // var type = localStorage.getItem('view_type');

      // var libraryCollection = new App.Collections.libraryItemCollection(library);
      // window.App.libraryItemCollection = libraryCollection;

      //TODO inital download status to each model


      //TODO librarySubscribeCollection

      if (window.localStorage.getItem('login_status') == 'true') {
        var libraryItemCollection = App.LibraryItemCollection;
        var viewTypeModel = new App.Models.viewType();
        var libraryGridView = new LibraryGridView({collection: libraryItemCollection});
        var libraryListView = new LibraryListView({collection: libraryItemCollection});
        var filterView = new FilterView({collection: libraryItemCollection, filter: null, model: viewTypeModel});
        var viewTypeView = new ViewTypeView({model: viewTypeModel});
        viewTypeView.render();
        window.App.viewTypeModel = viewTypeModel;
        window.App.viewTypeView = viewTypeView;
        window.App.libraryGridView = libraryGridView;
        window.App.libraryListView = libraryListView;
        window.filterView = filterView;
        var sortModel = new App.Models.SortModel({"touched_at":"check","id":"uncheck"});
        var searchModel = new App.Models.SearchModel();
        var sortView = new SortView({model: sortModel});
        window.sortView = sortView;
        var searchView = new SearchView({model: searchModel});
        window.searchView = searchView;
        var topBarView = new TopBarView({model: null});
        window.App.$filterBar.show();
      } else { // deprecated part => not login show default or free bookshelfs
        var libraryPreviewCollection = App.LibraryPreviewCollection;
        var viewTypeModel = new App.Models.viewType();
        var libraryGridView = new LibraryGridView({collection: libraryPreviewCollection});
        var libraryListView = new LibraryListView({collection: libraryPreviewCollection});
        var filterView = new FilterView({collection: libraryPreviewCollection, filter: null, model: viewTypeModel});
        window.filterView = filterView;
        var sortModel = new App.Models.SortModel({"touched_at":"check","id":"uncheck"});
        var searchModel = new App.Models.SearchModel();
        var sortView = new SortView({model: sortModel});
        window.sortView = sortView;
        var searchView = new SearchView({model: searchModel});
        var topBarView = new TopBarView({model: null});
        window.App.$filterBar.show();
      }
      return this;
  },

  sync: function(library){
    var libraryGridView = new LibraryGridView({collection: App.LibraryItemCollection});
    var libraryListView = new LibraryListView({collection: App.LibraryItemCollection});
  }
});
