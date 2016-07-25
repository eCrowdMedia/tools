var SortView = Backbone.View.extend({

  el: '#sort-library',

  events: {
    'click .sort': 'sort',
    'focus' : 'dialog',
    'blur' : 'dialog',
  },

  sort: function(event){

    var grid = $('#grid').data('action');

    if (grid == 'enable')
      $('.library-grid-container').css('display', 'none');
    else
      $('.library-list-container').css('display', 'none');

    var target = event.target,
    $target = $(target);
    $target.siblings().attr('data-action','uncheck').find('span').attr('data-action','uncheck');
    $target.attr('data-action','check').find('span').attr('data-action','check');
    console.log('value:' + $target.attr('value'));
    var key = $target.attr('value'),
        $select = this.$el.find('#select');
        that = this;
    console.log('key: ' + key);

    if (key == 'touched_at')
        $select.text('最近閱讀');
    else if (key == 'id')
        $select.text('最近購買');

    window.App.$loadbook.css('display', 'block');

    /*this.$finish.one('click', function(){

      if(key === 'touched_at'){
        that.model.set({'sort': key, 'touched_at': 'check', 'id': 'uncheck'});
      } else {
        that.model.set({'sort': key, 'id': 'check', 'touched_at': 'uncheck'});
      }
      App.$loader.toggleClass('show');
      // console.log('model.attributes: ' + JSON.stringify(that.model.attributes));
      window.App.Vent.trigger('sort', key);

      setTimeout(function(){
         $.force_appear(); //trigger appear event
      }, 10);
    });*/

    that.model.set('sort', key);

    setTimeout(function() {
       window.App.Vent.trigger('sort', key);
       $.force_appear(); //trigger appear event
    }, 50);
  },

  initialize: function(){
    var $finish = $('.filter-finish');
    this.$finish = $finish;
    this.setElement(window.document.querySelectorAll('#sort-library'));
    this.listenTo(this.model, 'change', this.render);
    // this.render();
    // window.App.Vent.trigger('filter');
  },

  dialog: function(event){
    this.$el.find('#dialog_sort').toggleClass('open');
  },

  render: function(){
    // var key = this.model.get('sort');
    // this.$el.find('option[value='+key+']').attr('selected', true);
    /*var temp = require('./javascripts/templates/sort_item.hbs');
    var template = temp(this.model.attributes);
    this.$el.empty().append(template);*/
    return this;
  }
});
