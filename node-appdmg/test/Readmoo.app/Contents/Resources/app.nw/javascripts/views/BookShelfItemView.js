var BookShelfItemView = Backbone.View.extend({
  events: {
    'click li' : 'doClick',
    'mouseenter li': 'doHover',
    'mouseleave li': 'unHover'
  },

  template: require('./javascripts/templates/bookshelf_item.hbs'),

  initialize: function(){
    // var temp = require('./javascripts/templates/bookshelf_item.hbs');
    var el = this.template(this.model.attributes);
    this.setElement(el);
  },

  doClick: function(event){
    $('.number').removeClass('check');
    $(".bookshelf").removeClass('liActive');
    // alert('data-name: ' + $(event.currentTarget).attr('data-name'));
    var key = $(event.currentTarget).attr('data-name'),
        optClass = 'tags',
        regex = /馬拉松/;
    // this.$el.find('.number').toggleClass('check');
    this.$el.addClass("liActive");
    if (key === '全部書籍') {
      key = '',
      optClass = 'whole';
    } else if (key === '未分類書籍') {
      key = '未分類'
    } else if (key === '私密書籍') {
      key = 'true',
      optClass = 'private';
    } else if (key === '限制級書籍') {
      key = 'true',
      optClass = '18x';
    } else if (key.match(regex)) {
      key = 'true',
      optClass = 'marathon';
    }
    var option = {
      optClass: optClass,
      key: key
    };

    setTimeout(function(){
      $.force_appear(); //trigger appear event
    }, 100);
    window.App.Vent.trigger('filter', option);
  },

  doHover: function(event){
    // console.log('doHover');
    /*var key = $(event.currentTarget).attr('data-name'),
        className = $(event.currentTarget).attr('class'),
        title = $(event.currentTarget).attr('title');
    console.log('class name: ' + className);*/
    this.$el.find('.number').addClass('on');
    // this.$el.find('li[data-name='+key+']').css({'color':'fff', 'background-color':'#ccc'});
    /*if (className !== 'number')
      this.$el.find('li[data-name='+key+']').css({'color':'#fff',}).next().css({'color':'#ccc', 'background-color':'#fff'}).closest('.bookshelf').css({'background-color':'#0099FF'});
    else
      this.$el.find('.number[title='+title+']').css({'color':'#ccc', 'background-color':'#0099FF'}).prev().css({'color':'#fff', 'background-color':'#F5F2F2'}).closest('.bookshelf').css({'background-color':'#0099FF'});*/
  },

  unHover: function(event) {
    // console.log('unHover!');
    /*var key = $(event.currentTarget).attr('data-name'),
        className = $(event.currentTarget).attr('class'),
        title = $(event.currentTarget).attr('title');*/
    this.$el.find('.number').removeClass('on');
    // this.$el.find('.number[title='+title+']').css({'color':'#ccc', 'background-color':'#fff'});
    /*if (className !== 'number')
      this.$el.find('li[data-name='+key+']').css({'color':'#979797', 'background-color': '#F5F2F2'}).next().css({'color':'#fff', 'background-color':'#ccc'}).closest('.bookshelf').css({'background-color':'#F5F2F2'});
    else
      this.$el.find('.number[title='+title+']').css({'color':'#fff', 'background-color':'#ccc'}).prev().css({'color':'#979797', 'background-color':'#F5F2F2'}).css({'background-color':'#F5F2F2'});*/
  },

  render: function(){
    return this;
  }

});
