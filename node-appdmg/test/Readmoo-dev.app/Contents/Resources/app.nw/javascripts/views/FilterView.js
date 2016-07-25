
var FilterView = Backbone.View.extend({
  tags: undefined,

  // el: '#filter-library',
  // el: '.filter',
  el: '#search-library',

  events: {
    'focusin': 'dialog',
    'focusout': 'dialog',
    'click .action ': 'filter',
    'click .state ': 'filter'
  },

  initialize: function(){
    /*var $finish = $('.filter-finish');
    this.$finish = $finish;
    this.listenTo(this.model, 'change', this.render);
    console.log('model: ' + JSON.stringify(this.model.attributes));*/
    var tags = _.uniq(this.collection.pluck('tags'));
    for (var i = 0; i< tags.length; i++){
      if (tags[i] === null){
        tags[i] = '未分類';
      }
    }
    this.tags = tags;
    // var shelf = this.collection.where({tags: "單車書籍"});
    this.render();
    // window.App.Vent.trigger('filter');
  },

  dialog: function(event){
    console.log('dialog');
    this.$el.find('#dialog_filter').toggleClass('open');
  },

  filter: function(event){
    /*var $selected = this.$el.find('option:selected');
    var key = $selected.val();
    console.log($selected[0].parentNode.className);
    var optClass = $selected[0].parentNode.className;
    var option = {
      optClass: optClass,
      key: key
    };*/

    console.log('item got click');
    var target = event.target,
        $target = $(target),
        that = this,
        title = $target.attr('value'),
        $select = this.$el.find('#select');
    // console.log('value:' + $target.attr('value'));

    switch (title) {

      case 'open':
            $select.text('已下載書籍');
            break;
      case 'start':
            $select.text('尚未開始');
            break;
      case 'reading':
            $select.text('正在閱讀');
            break;
      case 'finished':
            $select.text('已完讀');
            break;
      default:
            $select.text('全部書籍');
            break;
    }

    if ($target.attr('value') == '')
      this.$el.find('#select').text('全部書籍');
    $target.siblings().attr('data-action','uncheck').find('span').attr('data-action','uncheck');
    $target.attr('data-action','check').find('span').attr('data-action','check');
    // alert('got click');
    console.log('optclass:' + $target.attr("class") + ' key: ' + $target.attr('value'));
    var option = {
      optClass: $target.attr('class'),
      key: $target.attr('value')
    };

    /*this.$finish.one('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      console.log('key: ' + option.key);
      switch(option.key){
       case "open":
         that.model.set({'all':'uncheck','open':'check', 'private':'uncheck',
         'reading':'uncheck', 'start':'uncheck', 'finished':'uncheck'});
         // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
         break;
       case "true": //private option
         that.model.set({'all':'uncheck','open':'uncheck', 'private':'check',
         'reading':'uncheck', 'start':'uncheck', 'finished':'uncheck'});
         // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
         break;
       case "reading":
          that.model.set({'all':'uncheck','open':'uncheck', 'private':'uncheck',
          'reading':'check', 'start':'uncheck', 'finished':'uncheck'});
          // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
          break;
       case "start":
          that.model.set({'all':'uncheck','open':'uncheck', 'private':'uncheck',
          'reading':'uncheck', 'start':'check', 'finished':'uncheck'});
          // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
          break;
       case "finished":
          that.model.set({'all':'uncheck','open':'uncheck', 'private':'uncheck',
          'reading':'uncheck', 'start':'uncheck', 'finished':'check'});
          // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
          break;
       default:
         that.model.set({'all':'check','open':'uncheck', 'private':'uncheck',
          'reading':'uncheck', 'start':'uncheck', 'finished':'uncheck'});
          // console.log('open page model.attributes: ' + JSON.stringify(that.model.attributes));
          break;
      }*/
      // this.model.set({'private': 'check'});
      window.App.Vent.trigger('filter', option);
      setTimeout(function(){
         $.force_appear(); //trigger appear event
      }, 10);
  },

  render: function(){
    // this.$el.text(this.model.get('filter'));
    // var temp = require('./javascripts/templates/filter_menu.hbs');
    // var temp_type = require('./javascripts/templates/view_type.hbs');
        // temp_filter = require('./javascripts/templates/search_item.hbs');
    // var template = temp(this.tags);
    // var typeTemplate = temp_type(this.model.attributes);
        // filterTemplate = temp_filter(this.model.attributes);
    // this.$el.find('.tags').empty().append(template);
    // this.$el.find('.view-type').empty().append(typeTemplate);
    // this.$el.find('#search-library').empty().append(filterTemplate);
    return this;
  }
});
