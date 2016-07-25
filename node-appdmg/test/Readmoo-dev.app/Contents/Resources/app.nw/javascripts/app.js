var handlebars = require('handlebars');
var request = require('request');
var oAuth = require('./javascripts/oAuth.js');
var moment = require('moment');
var Utils = require('./javascripts/Utils.js')
var os = require('os');
var fse = require('fs-extra');
var platform = os.platform();
var ncp = require('ncp').ncp;
ncp.limit = 16;

// console.log(moment().locale('zh-tw').startOf('day').fromNow());

handlebars.registerHelper( "checkStatus", function ( status ){
    if (status == "finished" )
    {
        return '100';
    }
    else if (status == "start")
    {
        return '0%';
    }
});

// 就是其他地方可以用 window.App 取得的變數
var App = {
  Views: {

  },
  Models: {

  },
  Collections: {

  },
  Vent: _.extend({},Backbone.Events)
};

App.Collections.MenuListCollection = Backbone.Collection.extend({

});

App.Models.LoginModel = Backbone.Model.extend({
  defaults: {
    udid: window.localStorage.getItem('-nw-udid'),
    accessToken: window.localStorage.getItem('-nw-access_token'),
    userId: window.localStorage.getItem('-nw-userid'),
    userProfile: $.parseJSON(window.localStorage.getItem('-nw-'+window.localStorage.getItem('-nw-userid')+'-userprofile')),
    privateKey: window.localStorage.getItem('privateKey')
  }
});

App.Models.PageModel = Backbone.Model.extend({
  defaults: {
    activePage: 'library',
    pageConfig: [
      /*{
        name: "portal",
        text: "Readmoo 首頁"
      },*/
      {
        name: "sync",
        text: "同步書櫃"
      },
      {
        name: "library",
        text: "個人書櫃",
        bookshelf: "編輯書櫃"
      },
      // {
      //   name: "subscribe",
      //   text: "99元月租包"
      // },
      // {
      //   name: "badges",
      //   text: "徽章"
      // },
      /*{
        name: "highlights",
        text: "劃線註記"
      },*/

      {
        name: "award",
        text: "閱讀成就"
      },
      {
        name: "opinions",
        text: "意見回饋"
      },
      /*{
        name: "settings",
        text: "系統設定"
      },*/
     /* {
        name: "logout",
        text: "登出"
      }*//*,
      {
        name: "sell",
        text: "熱門新書"
      },
      {
        name: "newarrival",
        text: "新書上架"
      },
      {
        name: "highlights",
        text: "劃線註記"
      },
      {
        name: "sync",
        text: "同步書櫃"
      },
      {
        name: "freebooks",
        text: "免費書籍"
      },
      {
        name: "logout",
        text: "登出"
      }*/

    ]
  }
});

App.Models.SortModel = Backbone.Model.extend({

});

App.Models.SearchModel = Backbone.Model.extend({

});

App.Models.viewType = Backbone.Model.extend({
  defaults: {
    grid: 'enable',
    list: 'disable',
    all: 'check',
    open: 'uncheck',
    private: 'uncheck',
    reading: 'uncheck',
    start: 'uncheck',
    finished: 'uncheck'
  }
});

App.Collections.MenuListCollection = Backbone.Collection.extend({});
App.Collections.LibraryItemCollection = Backbone.Collection.extend({});
App.Collections.BookshelfItemCollection = Backbone.Collection.extend({});

//Views

/*App.Views.MenuItemView = Backbone.View.extend({
  initialize: function(){
    console.log(this.model);
    this.model.on('change:active', this.trigger, this);
  },

  events: {
    'click': 'activate'
  },

  activate: function(){
    this.model.collection.each(function(model){
      if (model !== this.model){
        model.set('active', '');
      }
    }, this);
    this.model.set('active', 'active');
  },

  trigger: function(model){

    if (model.get('active') !== ''){
      window.App.Vent.trigger('menuChange', model.get('name'));
    }

  },

  template: require('./javascripts/templates/menu_item.hbs'),

  render: function(){
    var temp = this.template(this.model.attributes);
    this.setElement(temp);
    return this;
  }
});*/

// App.Views.MenuListView = Backbone.View.extend({
//   el: '.menu',

//   initialize: function(){
//     // this.collection.on('change', this.render, this);
//     console.log(this.model.toJSON());
//     this.model.on('change:activePage', this.render, this);
//     Backbone.on("menu:click:", this.doStuff, this);
//   },

//   events: {
//     'click .menu-item': 'click'
//   },

//   click: function(event){
//     event.preventDefault();
//     var name = $(event.currentTarget).attr('data-name');
//     Backbone.trigger("menu:click:", name);
//     // $(event.currentTarget).toggle("collapsed");
//     // $('.menu-item').toggle("collapsed");
//     $('.mybooklist').toggle("in");
//     this.model.set('activePage', name);
//   },

//   template: require('./javascripts/templates/menu_list.hbs'),

//   doStuff: function(page){
//      if(page === 'library'){
//         // $(this).toggleClass("collapsed");
//         var $node = $(this.$el.find('.menu-item')[0]);
//         $node.toggleClass("collapsed");
//      }

//   },

//   render: function(){

//     // this.$el.empty();
//     var temp = this.template(this.model.attributes);
//     var activePage = this.model.get('activePage');

//     /*if(activePage === 'sync'){
//         activePage = 'library'; //override
//         //TODO sync percent diagram
//     }*/

//     if(activePage === 'library')
//       document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: seagreen');

//     // temp  = $(temp).find('[data-name='+activePage+']').attr('data-state', 'active');
//     // console.log(temp);
//     this.$el.empty().append(temp);
//     this.$el.find('[data-name='+activePage+']').attr('data-state', 'active');
//     if(window.nwApp)
//       window.nwApp.navigate(activePage, {trigger: true});

//     // this.collection.each(function(model){
//     //  var menuItemView = new App.Views.MenuItemView({model: model})
//     //  this.$el.append(menuItemView.render().el);
//     // }, this);
//   }
// });

// App.Views.SortView = Backbone.View.extend({
//   // el: '#sort-library',
//   events: {
//     // 'change': 'sort'
//     'click .sort': 'sort'
//   },

//   sort: function(event){
//     var target = event.target,
//         $target = $(target);
//     $target.siblings().find('span').attr('data-action','uncheck');
//     $target.find('span').attr('data-action','check');
//     var key = $target.attr('value'),
//         that = this;

//     this.$finish.on('click', function(){

//       if(key === 'touched_at'){
//         that.model.set({'sort': key, 'touched_at': 'check', 'id': 'uncheck'});
//       } else {
//         that.model.set({'sort': key, 'id': 'check', 'touched_at': 'uncheck'});
//       }
//       console.log('model.attributes: ' + JSON.stringify(that.model.attributes));
//       window.App.Vent.trigger('sort', key);
//     });
//   },

//   initialize: function(){
//     var $finish = $('.filter-finish');
//     this.$finish = $finish;
//     this.setElement(window.document.querySelectorAll('#sort-library'));
//     this.listenTo(this.model, 'change', this.render);
//     this.render();
//     // window.App.Vent.trigger('filter');
//   },

//   render: function(){
//     var key = this.model.get('sort');
//     // this.$el.find('option[value='+key+']').attr('selected', true);
//     var temp = require('./javascripts/templates/sort_item.hbs');
//     var template = temp(this.model.attributes);
//     this.$el.empty().append(template);
//     return this;
//   }
// });

/*App.Views.SearchView = Backbone.View.extend({
  el: '.searchbar',
  events: {
    'input input': 'search'
  },

  initialize: function(){
    this.listenTo(this.model, 'change:keyword', this.render);
  },

  search: function(e){
    var keyword = $(e.target).val();
    console.log(keyword);
    //todo check wether is blank keyword
    if(keyword == ""){
      keyword = '想找什麼書？';
    }
    this.model.set('keyword', keyword);
  },

  render: function(){
    window.App.Vent.trigger('search', this.model.get('keyword'));
  }
});*/

/* 
// 2016/01/27 「個人全部劃線註記」只是預留功能，目前不需要啟動時就產生
// 相關程式也停用（與 HighlightsPageView.js 有重複）
App.Collections.MyHighlightsCollection = Backbone.Collection.extend({});

App.Views.HighlightItemView = Backbone.View.extend({

  initialize: function(){
    // window.console.log(this.collection);
    var relativeDate = moment(this.model.attributes.highlight['highlighted_at']).locale('zh-tw').startOf('day').fromNow();
    this.model.get('highlight')['relative_date'] = relativeDate;
  },

  template: require('./javascripts/templates/highlight_item.hbs'),

  render: function(){
    // console.log(this.model.get('highlight')['relative_date']);
    var temp = this.template(this.model.attributes);
    this.setElement(temp);
    return this;
  }
});

App.Views.HighlightsListView = Backbone.View.extend({
  events: {
    'click .more': 'loadMore'
  },

  initialize: function(options){
    this.type = options.type;
    this.setElement(this.elementSelector());
    console.log(this.el);
    this.pagination = options.pagination;


    if(this.pagination){
      this.$el.find('.more').attr('data-more', this.pagination.next).show();
    }
    this.collection.on('add', this.render, this);
    this.render();
  },

  elementSelector: function(){
    return '.'+this.type+'-container';
  },

  loadMore: function(event){
    alert('got loadMore function');
    var that = this;
    var url = $(event.target).attr('data-more');
    oAuth.getMoreHighlights(url).done(function(highlights){
      that.collection.add(highlights.items);
    });
  },

  render: function(){
    var that = this;
    var $highlightList = this.$el.find('.highlights-list');
    $highlightList.empty();
    this.collection.each(function(model){
      var highlightItemView = new App.Views.HighlightItemView({model: model});
      $highlightList.append(highlightItemView.render().el);
    },this);
    return this;
  }
});

App.Views.HighlightsPageView = Backbone.View.extend({
    el: '[data-role=page].highlights',

    initialize: function(){
      oAuth.getMyHighlights().done(function(highlights){
        console.log(highlights);
        var myHighlightsCollection = new App.Collections.MyHighlightsCollection(highlights.items);
        var pagination = (highlights.pagination) ? highlights.pagination : null ;
        var myHighlightsListView = new App.Views.HighlightsListView({collection: myHighlightsCollection, pagination: pagination, type: 'my-highlights'});
      });
    },

    render: function(){

      return this;
    }
});
*/
