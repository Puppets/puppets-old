// The base controller from which all puppets extend
// This ties all of the pieces of the puppet together, and communicates with the outside world
// via the application's wreqr

(function() {

  var ItemView = Marionette.ItemView.extend({

    modelEvents: {
      'change': 'update'
    },

    constructor: function() {

      this._rendered = false;
      Marionette.View.prototype.constructor.apply( this, Array.prototype.slice.apply(arguments) );

    },

    render: function(){
      this.isClosed = false;

      this.triggerMethod("before:render", this);
      this.triggerMethod("item:before:render", this);

      var data = this.serializeData();
      data = this.mixinTemplateHelpers(data);

      var template = this.getTemplate();
      var html = Marionette.Renderer.render(template, data);

      this.$el.html(html);
      this.bindUIElements();

      this.triggerMethod("render", this);
      this.triggerMethod("item:rendered", this);

      return this;
    },

    updateDOM: function() {

      var newPromise = $.Deferred();
      this.updatePromises.push( newPromise );
      newPromise.resolve();

    },

    update: function() {

      if ( !this._isRendered ) {
        return;
      }

      this._shareUpdating();
      this.updatePromises = [];
      this.updateDOM.apply(this, Array.prototype.slice.apply(arguments));
      $.when.apply( $, this.updatePromises ).then(_.bind(this._shareUpdate, this));

    },

    _shareUpdating: function() {
      this.vent.trigger( 'view:updating' );
    },

    _shareUpdate: function() {
      this.vent.trigger( 'view:update' );
    }

  });

  window.Puppets = window.Puppets || {};
  window.Puppets.ItemView = ItemView;

})();