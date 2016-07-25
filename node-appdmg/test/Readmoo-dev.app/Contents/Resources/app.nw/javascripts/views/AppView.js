
var nwNotify = require('nw-notify'),
    moment = require('moment');

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
      defaultStyleText: {
          color: '#FF000',
          fontWeight: 'bold'
      }
});

var AppView = Backbone.View.extend({
    el: 'body',

    initialize: function(options){
      console.log('AppView initialize.');
      var that = this;
      var $sidebar = $('.sidebar');
      var $wrap = $('.sidebar-wall');
      var $sync = $('.topbar .sync');
      var $mainContent = $('.main-content');
      var $library = $('.wrapper .library');
      var $gridStyle = $('#grid-search-style');
      var $listStyle = $('#list-search-style');
      var $avatar = $('#avatar');
      // var $edit = $('.edit');
      var $loadbook = $('.loadbook');
      var $wall = $('.wall');
      var $loadavatar = $('.loadavatar');
      var $opinions = $('.opinions');
      var $filterBar = $('.inner-filter');
      var $iframe = $('iframe');

      window.App.$loadbook = $loadbook;
      window.App.$loadavatar = $loadavatar;
      window.App.$mainContent = $mainContent;
      window.App.$filterBar = $filterBar;
      window.App.$opinions = $opinions;
      window.App.$wall = $wall;
      window.App.$iframe = $iframe;

      // console.log('AppView() window.App.$loadbook = ' + window.App.$loadbook);

      $filterBar.hide();

      // if (navigator.onLine) {
      //   window.App.$loadbook.show();
      // } else {
      //   $('.offLine').css('display', 'block');
      //   $('.connect').on('click', function(){
      //       localStorage.removeItem('splash');
      //       // console.log('got click');
      //       if (navigator.onLine)
      //         window.location = 'app://readmoo/index.html';
      //       else
      //         alert('confirm network is ready'); //happen rarely
      //   });
      // }

      $avatar.on('focus', function(){
        $('#dialog_avatar').toggleClass('open');
      });

      $avatar.on('blur', function(){
        $('#dialog_avatar').toggleClass('open');
      });

      this.model.set("client_id", oAuth.oAuthInfo.client_id);

      $('.app-title .shopping').on('click', function(){
        if (navigator.onLine){
          gui.Shell.openExternal('https://store.readmoo.com/forever/index/4');
        } else {
          nwNotify.notify('目前網路狀態為離線，本服務需要網路連線才能使用！', '');
        }
      });

      $('.logo img').on('click', function(){
        // gui.Window.open('https://store.readmoo.com/');
        gui.Shell.openExternal('https://store.readmoo.com/');
      });

      $sync.on('click', function(event){

       var node = $('.menu-item')[2],
           $node = $(node),
           $booklist = $('.mybooklist');
       $node.toggleClass("collapsed");
       if ($node.hasClass("collapsed"))
         $booklist.slideUp(450);
       else
         $booklist.slideDown(450);

       window.nwApp.navigate("sync", {trigger: true});
      });

      /*$edit.on('click', function(event){
        event.preventDefault();
        // var path = process.cwd() + '/images/default-avatar.jpg';
        var notification = new Notification('編輯書籍功能尚未支援! :)', {
          tag: '',
          body: ''
        });
        notification.onshow = function(){
          setTimeout(function(){ notification.close();}, 3000);
        };
      });*/

      //set default view type
      var type = {grid: "enable", list: "disable"};
      localStorage.setItem('view_type', JSON.stringify(type));

      this.model.on('change:activePage', this.render, this);
      // var LoginModel = require('./javascripts/models/LoginModel.js');
      var loginModel = new App.Models.LoginModel();
      var userProfileView = new UserProfileView({model: loginModel});
      userProfileView.render();
      var opinionsView = new OpinionsView({model: this.model});
      window.userProfileView = userProfileView;

      // unused config
      // var menuConfig = require('./javascripts/configs/menuConfig.js');
      // var memuListCollection = new App.Collections.MenuListCollection(pageModel.get('pageConfig'));

      var menuListView = new MenuListView({model: this.model});
      var informationView = new InformationView({model: this.model});
      var bookShelfPageView = new BookShelfPageView();
      window.bookShelfPageView = bookShelfPageView;

      var appear = _.throttle(function(){
         $.force_appear(); //trigger appear event
         window.searchView.gridCache();
         window.searchView.listCache();
      }, 100);

      this.libraryPageView = new LibraryPageView();

      var library = this.libraryPageView.library;
      var libraryCollection = undefined;
      var that = this;

      if (library) {
        oAuth.getMeLibraryTags().done(function(){
            var marathon = Utils.persist.marathonTag();

            if (typeof marathon !== 'undefined') {
              $.each(marathon['tag']['books'], function(index, bookId) {
                Utils.persist.updateMarathon(library, bookId);
              });
            }

            libraryCollection = new App.Collections.LibraryItemCollection(library);
            window.App.LibraryItemCollection = libraryCollection;
            checkDownloading(libraryCollection).done(function(){
            that.libraryPageView.render();
            appear();
            var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
            var bookshelfItemCollection = new App.Collections.BookshelfItemCollection(tags);
            // Utils.persist.Arrange(bookshelfItemCollection);
            window.App.BookshelfItemCollection = bookshelfItemCollection;
            bookShelfPageView.render();
          }.bind(this));
        }).fail(function(){
          console.log('fail to get tags');
          libraryCollection = new App.Collections.LibraryItemCollection(library);
            window.App.LibraryItemCollection = libraryCollection;
            checkDownloading(libraryCollection).done(function(){
              that.libraryPageView.render();
              appear();
              var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
              var bookshelfItemCollection = new App.Collections.BookshelfItemCollection(tags);
              // Utils.persist.Arrange(bookshelfItemCollection);
              window.App.BookshelfItemCollection = bookshelfItemCollection;
              bookShelfPageView.render();
            }.bind(this));
        });
      } else if (localStorage.getItem('login_status') == "true") { //TODO subscribe_ch
          // $.when(oAuth.getMeLibraryCompare(),oAuth.getForever()).then(function(){});
          Utils.persist.getLastSyncTime(moment);
          oAuth.getMeLibraryCompare().done(function(){
            oAuth.getMeLibraryTags().done(function(){
              var library = $.parseJSON(window.localStorage.getItem('-nw-library'));
              var marathon = Utils.persist.marathonTag();

              if (typeof marathon !== 'undefined') {
                $.each(marathon['tag']['books'], function(index, bookId) {
                  Utils.persist.updateMarathon(library, bookId);
                });
              }

              libraryCollection = new App.Collections.LibraryItemCollection(library);
              window.App.LibraryItemCollection = libraryCollection;
              that.libraryPageView.render();
              var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
              var bookshelfItemCollection = new App.Collections.BookshelfItemCollection(tags);
              // Utils.persist.Arrange(bookshelfItemCollection);
              window.App.BookshelfItemCollection = bookshelfItemCollection;
              bookShelfPageView.render();
              appear();
            });
          }).fail(function(){ // in case of no book in bookshelf
            libraryCollection = new App.Collections.LibraryItemCollection({});
            window.App.LibraryItemCollection = libraryCollection;
            that.libraryPageView.render();
            window.App.$loadbook.hide();
            appear();
          });
      } else { //prepare preview and free books 孫子兵法
        var pre_library = [{"action":"open","download_status":"finish","tags":"遠景叢書","library_item":{"id":67797,"file_size":1327199,
            "private":false,"archive":false,"book":{"id":"210010466000101","title":"我是貓","author":"夏目漱石","publisher":"遠景",
            "permalink":"210010466000101","permalink_url":"https://readmoo.com/book/210010466000101","cover_url":"https://cdn.readmoo.com/cover/8f/cf38l92_210x315.jpg",
            "18x":false},"reading":{"id":51924,"state":"reading","private":false,"started_at":"2013-12-12T03:55:14Z","touched_at":"2015-05-28T09:44:27Z","ended_at":null,
            "duration":19560,"progress":"68.20","permalink_url":"https://readmoo.com/mooer/reading/single/lljl9jqlh/210010466000101","comments_count":1,"highlights_count":4,
            "position":0.682,"position_updated_at":"2015-05-28T09:44:27Z","location":"/6/24!/4/118/1:369","rating":0}},"download_status":"finish",
            "cover_url":"./images/openbook.png","book_download_percent":99}];

        PreviewlibraryCollection = new App.Collections.LibraryItemCollection(pre_library);
        console.log('PreviewlibraryCollection: ' + PreviewlibraryCollection);
        window.App.LibraryPreviewCollection = PreviewlibraryCollection;
        that.libraryPageView.render(pre_library);
        appear();
        // fs.copy('./api/preview/210010466000101.zip', './api/book/210010466000101.zip', function (err) {
        //   if (err) return console.error(err)
        //     console.log("success!")
        // }) // copies file
      }

      window.menuListView = menuListView;
      window.InformationView = InformationView;
      // window.bookShelfPageView = bookShelfPageView;

      function menu_backOff(){
        // window.nwApp.navigate("menu", {trigger: true});
        $(this).addClass('hide');
        $sidebar.toggleClass('active');
        var $listItem = $('.library-list-item');
        var $gridItem = $('.library-grid-item');
        $gridItem.toggleClass('blur');
        $listItem.toggleClass('blur');

        if($sidebar.hasClass('active')){
          $wrap.css("display", "block");
          $wrap.animate({opacity: 1}, 'linear');
          $wrap.one('click', function(){
            $gridItem.removeClass('blur');
            $listItem.removeClass('blur');
            $sidebar.removeClass('active');
            $(this).animate({opacity: 0}, 'linear', function(){
              // $('.sidebar-wall').css("display", "none");
              // that.hide();
              $(this).css('display', 'none');
            });
          });
        } else {
          $wrap.animate({opacity: 0}, 'linear', function(){
            $wrap.css("display", "none");
          });
        }
      }

      function checkDownloading(LibraryItemCollection) {
        var dtd = $.Deferred();
        var count = window.App.LibraryItemCollection.length;
        var bookId = 0;
        var str = "";
        App.LibraryItemCollection.each(function(model){
          count -=1;
          // console.log('id: ' + model.cid +  ' count: ' + count);
          if (model.get('library_item')){
            bookId = model.get('library_item')['book']['id'];
            str = '-nw-'+bookId+'-download';
            if (localStorage.getItem(str) == "finish") {
               model.set({'action':'open'});
            } else {
              model.set('download_status','none');
            }

            /*if(model.get('action') === 'downloading'){
              model.set('action', "download");
              model.set('download_status', "none");
            }*/
            if(count == 0)
              dtd.resolve();
          } else {
            dtd.resolve();
          }
        });
        return dtd.promise();
      };

      function filter_backOff(event){
        event.preventDefault();
        $filterWall.toggleClass('open');
        if($filterWall.hasClass('open')){
            $filterWall.css({"display":"block", "height":"auto"});
            $filter.css("display", "block");
            setTimeout(function(){
              $filterWall.css("opacity",1);
              $filter.css("opacity",1);
            }, 50);
        } else {
            document.body.style.overflow = 'auto';
            window.filterView.render();
            window.sortView.render();
            $filterWall.css("opacity",0);
            $filter.css("opacity",0);
            setTimeout(function(){
              $filterWall.css({"display":"none", "height":0});
              $filter.css("display","none");
            }, 600);
        }
      }

      /*window.App.Vent.on('menuChange', function(pageName){
        if(pageName === 'sync')
          pageName = 'library'; //override
        this.model.set('activePage', pageName);
      },this);*/

      // $finish.on('click', filter_backOff);
      // $filterWall.on('click', filter_backOff);

      // $('.menu-bar').on('click', menu_backOff);

      // $('.sidebar-close').on('click', menu_backOff);

      // menuListView.$('[data-name=library]').trigger('click');

      // 2016/01/27 「個人全部劃線註記」只是預留功能，目前不需要啟動時就產生
      // 相關程式也停用（與 HighlightsPageView.js 有重複）
      // this.highlightsPageView = new App.Views.HighlightsPageView();

      // if(loading_win)
      //   loading_win.close();
    },
    hide: function(){
      var $sidebar = $('.sidebar');
      $sidebar.removeClass('active');
    },
    render: function(){
      if (localStorage.getItem('app_launch') !== 'true'){
        // $('body').css('text-indent', '-9999px');
      } else {
        win.show();
      }
      var pageName = this.model.get('activePage');
      $('.wrapper').attr('data-action', 'open');

      // 2016/04/27 此處可以控制起始畫面是「格狀」或是「條列」
      $('.library-grid-item').appear(); // 若無此行，看到書櫃時，書封都是空白
      $('.library-list-item').appear();

      setTimeout(function(){
         $.force_appear(); //trigger appear event
      }, 1000);

      /*if(pageName === 'sync'){
        pageName = 'library';
        $('.sync-progress').css('display','block');
      }

      setInterval(function(){
        $('.sync-progress').css('display','none');
      }, 5000);*/

      if (pageName === 'logout'){
        this.logout();
      } else {
        this.$el.find('[data-role=page]').hide();
        this.$el.find('[data-role=page].'+pageName).show();
        if (!localStorage.getItem('app_launch') && localStorage.getItem('login_status') == 'true') {
          localStorage.setItem('app_launch', true);
        }
      }
      return this;
    },

    // menuChangeHandler: function(event){
    //  var name = $(event.currentTarget).attr('data-name');
    //  if (name === 'logout'){
    //    this.logout();
    //  }else{
    //    this.model.set('activePage', name);
    //  }
    // },
    // changePage: function(model){
    //  var pageName = this.model.get('activePage');
    //  if (pageName === 'logout'){
    //    this.logout();
    //  }else{
    //    this.$el.find('[data-role=page]').hide();
    //    this.$el.find('[data-role=page].'+pageName).show();
    //  }
    // },
    logout: function(){
      console.log('do nothing!');
    }
  });

window.App.appView = AppView;
