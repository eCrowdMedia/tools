console.log("nwAppRouter.js");

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
    defaultStyleText: {
        color: '#FF000',
        fontWeight: 'bold'
    }
});

// var Splash = require('./javascripts/splash.js');

var nwAppRouter = Backbone.Router.extend({
      // Routes can contain parameter parts, :param, which match a single URL component between slashes;
      // and splat parts *splat, which can match any number of URL components.
      // Part of a route can be made optional by surrounding it in parentheses (/:optional).
      // A route of "search/:query/p:page" will match a fragment of #search/obama/p2, passing "obama" and "2" to the action.
      // A route of "file/*path" will match #file/nested/folder/file.txt, passing "nested/folder/file.txt" to the action.
      // A route of "docs/:section(/:subsection)" will match #docs/faq and #docs/faq/installing, passing "faq" to the action in the first case, and passing "faq" and "installing" to the action in the second.
      // Trailing slashes are treated as part of the URL, and (correctly) treated as a unique route when accessed. docs and docs/ will fire different callbacks. If you can't avoid generating both types of URLs, you can define a "docs(/)" matcher to capture both cases.
      routes: {
        "": "index",
        'grid': "grid",
        "list": "list",
        "sync": "sync",
        "menu": "menu",
        "award": "award",
        "library": "library",
        "logout": "logout",
        "filter": "filter",
        "login": "login",
        "freebooks": "freebooks",
        "portal": "portal"
      },
      initialize: function(options) {
        console.log('nwapp initialize!');
        var pageModel = new App.Models.PageModel();
        // this.appView = new AppView({model: pageModel});
        this.appView = new window.App.appView({model: pageModel});
        window.App.appView = this.appView;
        var $grid = $('.library-grid-container'),
            $list = $('.library-list-container'),
            that = this;

        console.log('copyPath = ' + copyPath);

        // var promise = Splash.animate(pkg);
        var promise = splashAnimation(copyPath);

        promise.done(function() {
          console.log('promise.done');
          if (navigator.onLine) {
            window.App.appView.render();
            CheckUpdate(true, copyPath);
          } else {
            window.App.appView.render();
          }
        });

        /*$('.topbar').attr('data-action', 'open');
        $('.wrapper').attr('data-action', 'open');
        window.App.appView.render();*/

        this.$grid = $grid;
        this.$list = $list;
        // console.log('$grid.length: ' + $grid.length);
      },
      // index: function() {
      //   // App 啟動過程會經過這裡
      //   console.log('route to index');
      // },
      grid: function() {
        console.log('grid');

        var idBook = null,
            posX = 300,
            posY = 100;
        do {
          // 確保是 Readmoo ID
          var elem = document.elementFromPoint(posX, posY);
          var idBook = $(elem).parent().closest('li').attr('data-bookid'); // 取得最靠近的 parent='li'
          posY += 10; // 預防剛好落在書封間的空隙，就向下移一點位置
        } while (!$.isNumeric(idBook));
 

        var library = $.parseJSON(window.localStorage.getItem('-nw-library')),
            update = localStorage.getItem('gridView_update');

        if (window.App.$mainContent.css('display') == 'none')
          window.App.$mainContent.css('display', 'block');

        if (library && library.length !== window.App.libraryGridView.collection.length) {
          // 書櫃書籍數量不同
          console.log("length not equal");
          window.App.libraryGridView.collection.set(library);
          window.App.libraryGridView.render();
        } else if (library && update == 'true'){
          // 強迫更新書櫃
          console.log("update is true");
          window.App.libraryGridView.collection.set(library);
          window.App.libraryGridView.render();
          localStorage.setItem('gridView_update', 'false');
          window.searchView.gridcache = [];
          window.searchView.gridCache();
        }

        if (library) {
          // 書櫃有書
          console.log('route to grid with books');
          this.$grid.css('display', 'block');
          this.$list.css('display', 'none');
          window.App.Vent.off('search');
          window.App.Vent.on('search', window.App.libraryGridView.search, window.App.libraryGridView);
          /*document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: seagreen');
          document.styleSheets[0].addRule('.topbar .list-style::before', 'background-color: #00A0E8');*/
        } else { // in no book case
          // 書櫃沒有書
          /*notifier.notify({
           'title': 'Readmoo 服務提示',
           'message': ' 你的書櫃還沒有電子書，請至網站領取免費書',
           'sender': 'com.node-webkit-builder.readmoo',
           // 'contentImage': path,
           'sound': 'Pop'
          });*/
          console.log('route to grid without book');
          this.$grid.css('display', 'block');
          this.$list.css('display', 'none');
        }

        if ($.isNumeric(idBook)) {
          first = $("ol.library-grid-container li[data-bookid='" + idBook + "']");

          // 將對應的書封，盡量靠近左上角顯示
          // first[0].scrollIntoView()
          var topBarHeight = $('.inner-filter').height();
          $(window).scrollTop(first.eq(0).offset().top-topBarHeight);

          // first[1].scrollTop(200);
          // first.scrollIntoView({
          //     behavior: "smooth", // or "auto" or "instant"
          //     block: "start" // or "end"
          // });
        }

        setTimeout(function() {
          window.bookShelfPageView.render();
          /*$(window).scrollTop(1); //work around to trigger appear event*/
          $.force_appear(); //trigger appear event
        }, 100);
        /*document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: seagreen');
        document.styleSheets[0].addRule('.topbar .list-style::before', 'background-color: #00A0E8');*/
      },
      list: function() {
        console.log('list');

        var idBook = null,
            posX = 300,
            posY = 100;
        do {
          // 確保是 Readmoo ID
          var elem = document.elementFromPoint(posX, posY);
          var idBook = $(elem).parent().closest('li').attr('data-bookid'); // 取得最靠近的 parent='li'
          posY += 10; // 預防剛好落在書封間的空隙，就向下移一點位置
        } while (!$.isNumeric(idBook));
 

        var library = $.parseJSON(window.localStorage.getItem('-nw-library')),
            update = localStorage.getItem('listView_update');

        if (window.App.$mainContent.css('display') == 'none')
          window.App.$mainContent.css('display', 'block');

        if (library && library.length !== window.App.libraryListView.collection.length) {
          window.App.libraryListView.collection.set(library);
          window.App.libraryListView.render();
        } else if (library && update == 'true') {
          window.App.libraryListView.collection.set(library);
          window.App.libraryListView.render();
          localStorage.setItem('listView_update', false);
          window.searchView.listcache = [];
          window.searchView.listCache();
        }

        if (library) {
          console.log('route to list');
          this.$grid.css('display','none');
          this.$list.css('display', 'block');
          window.App.Vent.off('search');
          window.App.Vent.on('search', window.App.libraryListView.search, window.App.libraryListView);
          /*document.styleSheets[0].addRule('.topbar .list-style::before', 'background-color: seagreen');
          document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: #00A0E8');*/
        } else {
          console.log('route to list');
          this.$grid.css('display','none');
          this.$list.css('display', 'block');
        }

        if ($.isNumeric(idBook)) {
          first = $("ol.library-list-container li[data-bookid='" + idBook + "']");

          // 將對應的書封，盡量靠近左上角顯示
          var topBarHeight = $('.inner-filter').height();
          $(window).scrollTop(first.eq(0).offset().top-topBarHeight);
        }

        setTimeout(function() {
          window.bookShelfPageView.render();
          /*$(window).scrollTop(1); //work around to trigger appear event*/
          $.force_appear(); //trigger appear event
        }, 100);
        /*document.styleSheets[0].addRule('.topbar .list-style::before', 'background-color: seagreen');
        document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: #00A0E8');*/
      },
      award: function() {
        console.log('award page!');
        // 實際上仍回到 MenuListView click: function(event) 去做事
      },
      library: function() {
        console.log('route to library!');
        if (window.App.$mainContent.css('display') == 'none') {
          // window.App.$mainContent.css('display', 'block');
          var $iframe = $('iframe');
          var $mainContent = window.App.$mainContent;
          if ($iframe.css('display') == 'block')
            $iframe.fadeOut('slow');
          $mainContent.fadeIn('fast');
        }

        var library = $.parseJSON(window.localStorage.getItem('-nw-library'));
        var that = this;
        libraryItemCollection = new App.Collections.LibraryItemCollection(library);

        libraryItemCollection.each(function(model) {
          if (model.get('library_item')){
            bookId = model.get('library_item').book.id;
            var status = window.localStorage.getItem('-nw-'+bookId+'-download');
            if(status === 'finish'){
              model.set({'download_status':'finish'});
            } else {
              model.set({'download_status':'none'});
            }
            // console.log('download_status: ' + status);
          }
        });

        if (window.searchView){
          window.searchView.gridCache();
          window.searchView.listCache();
        }
        window.App.LibraryItemCollection = libraryItemCollection;
        // that.appView.libraryPageView.sync(library);
        var bookShelfView = new BookShelfPageView({});
        // var filterView = new FilterView({collection: libraryItemCollection, filter: null});
        bookShelfView.render();
      },
      filter: function() {
        console.log('got filter !');
      },
      menu: function() {
        console.log('menu');
        //
      },
      sync: function() { // 點擊書櫃區的「同步書櫃」功能
        console.log('nwAppRouter sync()');
        // var syncView = new SyncView(),
        var $sync = $('#sync_icon');

        /*document.styleSheets[0].addRule('.topbar .list-style::before', 'background-color: #00A0E8');
        document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: #00A0E8');*/

        // console.log('data libraryPageView: '+ this.appView.libraryPageView.library);
        // this.appView.libraryPageView.remove();

        $sync.toggleClass('on');

        var that = this;

        // var libraryPageView = new App.Views.LibraryPageView();
        //UTC time get from localStorage
        // 注意：getLastSyncTime() 取出 'last_library_sync' 之後，立即寫入新的 'last_library_sync'。格式為 "2016-04-27T03:46:42Z"
        var syncTime = Utils.persist.getLastSyncTime(moment); // 此行仍需要呼叫，目的是為了其他的同步書櫃行為（例如：關書）只需要部分清單
        // console.log('syncTime = ' + syncTime);
        // 既然讀者手動「同步書櫃」，就不限定時間，強制取得完整的清單
        var syncTime = "";
        // 取得書籍清單（有點詭異：oAuth.getMeLibraryCompare 內的第一行會顯示 console.log，但是如果在關書之後，再次同步書櫃，卻不會顯示 log，實際上卻有執行）
        oAuth.getMeLibraryCompare('', syncTime).done(function(res) {
          console.log('library update: ' + res.update);
          localStorage.setItem('gridView_update', res.update);
          localStorage.setItem('listView_update', res.update);
          var path = process.cwd() + '/images/default-avatar.jpg';

          // 'syncTime' 是用來檢查 24 小時的間隔時間（如：暢讀 99）
          var now = moment();
          localStorage.setItem('syncTime', now);
          window.AppSyncTime = now;

          // 取得書櫃清單
          oAuth.getMeLibraryTags().done(function() {
            var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
            var bookshelfItemCollection = new App.Collections.BookshelfItemCollection(tags);
            // Utils.persist.Arrange(bookshelfItemCollection);
            window.App.BookshelfItemCollection = bookshelfItemCollection;
            // 取得閱讀進度清單
            oAuth.getReading(syncTime).done(function(res){
              // console.log('reading update: ' + res.update);
              localStorage.setItem('gridView_update', res.update);
              localStorage.setItem('listView_update', res.update);
              Utils.persist.triggerState();
              // notifier.notify({
              //    'title': 'Readmoo',
              //    'message': '同步完成!',
              //    'contentImage': window.avatar_url,
              //    'sender': 'com.node-webkit-builder.readmoo',
              //    'wait': false,
              //    'sound': 'Hero'
              // });
              var notification = new Notification('Readmoo', {
                 tag: '',
                 body: '同步完成!'
              });
            });
          });

        // }).progress(function(result) {
        //     // syncView.drawProgress(result);
        //     // syncView.circle.animate(result,{
        //     //   from: {color: '#ddd'},
        //     //   to: {color: '#ddd'}
        //     // });
        //     console.log('got sync progress: ' + result);
        }).fail(function() {
          // var avatarPath = process.cwd() + '/images/default-avatar.jpg'; //TODO fail-icon
          if (platform !== 'darwin') {
            nwNotify.notify('Readmoo', '同步失敗!');
          } else {
            // notifier.notify({
            //  'title': 'Readmoo',
            //  'message': '同步失敗!',
            //  'contentImage': window.avatar_url,
            //  'sender': 'com.node-webkit-builder.readmoo',
            //  'sound': 'Glass'
            // });
            var notification = new Notification('Readmoo', {
               tag: '',
               body: '同步失敗!'
            });
          }
          setTimeout(function() {
            // syncView.remove();
            $('[data-name=library]').trigger('click');
            // window.nwApp.navigate("grid", {trigger: true});
          }, 1000);
        });
      },
      subscribe: function() {
        if (platform == 'darwin'){
          console.log('subscribe got click!');
          // notifier.notify({
          //    'title': 'Readmoo ',
          //    'message': '此功能尚未完成',
          //    'contentImage': window.avatar_url,
          //    'sound': 'Glass'
          // });
          var notification = new Notification('Readmoo', {
             tag: '',
             body: '此功能尚未完成'
          });
        } else {
           nwNotify.setConfig({
            appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
              defaultStyleText: {
                  color: '#FF000',
                  fontWeight: 'bold'
              }
          });

          nwNotify.notify('此功能尚未完成', '敬請期待！');
        }
      },
      freebooks: function() {
        if (platform == 'darwin') {
         // notifier.notify({
         //  'title': 'Readmoo',
         //  'message': '同步失敗!',
         //  'contentImage': window.avatar_url,
         //  'sender': 'com.node-webkit-builder.readmoo',
         //  'sound': 'Glass'
         // });
         var notification = new Notification('Readmoo', {
            tag: '',
            body: '同步失敗!'
         });
        } else {
          nwNotify.notify('此功能尚未完成', '敬請期待！');
        }
      },
      portal: function() {
          window.App.$mainContent.css('display', 'none');
          if (platform !== 'darwin') {
            nwNotify.notify('Readmoo首頁', '此功能尚未完成!');
          } else {
            // notifier.notify({
            //  'title': 'Readmoo首頁',
            //  'message': '此功能尚未完成!',
            //  'contentImage': window.avatar_url,
            //  'sender': 'com.node-webkit-builder.readmoo',
            //  'sound': 'Glass'
            // });
            var notification = new Notification('Readmoo', {
               tag: '',
               body: '此功能尚未完成 敬請期待！'
            });
          }
      },
      logout: function() {
        console.log("nwAppRouter() logout");
         var answer = window.confirm('登出帳號會刪除所有離線儲存的書籍及未同步的資料，\n確定要登出？');
         var access_token = oAuth.readLocalToken();
         if (answer) {
           // 清除資料
           Utils.persist.cleanupData();
           // var path = process.cwd() + '/images/default-avatar.jpg';
           // notifier.notify({
           //      'title': 'Readmoo',
           //      'message': '登出',
           //      'contentImage': path,
           //      'sender': 'com.node-webkit-builder.readmoo',
           //      'wait': false,
           //      'sound': 'Pop'
           // });
           var notification = new Notification('Readmoo', {
              tag: '',
              body: '登出'
           });

           if (navigator.onLine)
              window.location = oAuth.logout(access_token);

         } else {
            // $('[data-name=library]').trigger('click');
            window.nwApp.navigate("library", {trigger: true});
            // this.model.set('activePage', 'library');
         }
      },
      login: function() {

        //TODO login function

        // window.location = oAuth.oAuthInfo.url();
        // window.location = oAuth.logout();
        // window.location = localStorage.getItem('oAuth_uri');

      },
      start: function() {
        console.log('start!');
        Backbone.history.start({pushState: true});
        window.App['BooksOpenList'] = [];
        if (navigator.onLine) {
          $('[data-name=library]').trigger('click');
          window.App.$loadbook.show();
        } else {
          $('.offLine').css('display', 'block');
          $('.connect').on('click', function(){
              localStorage.removeItem('splash');
              // console.log('got click');
              if (navigator.onLine)
                window.location = 'app://readmoo/server.html';
              else
                alert('confirm network is ready'); //happen rarely
          });
        }
        // App.$loader.removeClass('show');
      }
  });

  window.App.nwAppRouter = nwAppRouter; // 但是卻在 global.window.nwAppRouter 看到
