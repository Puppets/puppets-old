// The base controller from which all puppets extend
// This ties all of the pieces of the puppet together, and communicates with the outside world
// via the application's wreqr

(function() {

  var Puppet = Marionette.Controller.extend({

    _isPuppet: true,

    constructor: function( name, app, options ){

      options = _.extend( {}, options );

      this.open = false;
      this._isInitialized= false;
      this.app = app;
      this.vent = new Backbone.Wreqr.EventAggregator();
      this.commands = new Backbone.Wreqr.Commands();
      this.reqres = new Backbone.Wreqr.RequestResponse();
      this.moduleName = name;

      this._configProperties( options );
      this._configLocalWreqr( options );
      this._configGlobalWreqr( options );

      this.region.duration = options.duration ? options.duration : 500;
      this.region.transition = options.transition ? options.transition : 'pop';

      this.vent.on( 'region:open',    _.bind(this._shareRegionOpen, this) );
      this.vent.on( 'region:ready',   _.bind(this._shareRegionReady, this) );
      this.vent.on( 'region:closing', _.bind(this._shareRegionClosing, this) );
      this.vent.on( 'region:close',   _.bind(this._shareRegionClose, this) );
      this.vent.on( 'view:updating',  _.bind(this._shareViewUpdating, this) );
      this.vent.on( 'view:update',    _.bind(this._shareViewUpdate, this) );

      // Call the parent's constructor function
      Marionette.Controller.prototype.constructor.apply(this, Array.prototype.slice(arguments));

    },

    // Communications & such
    _shareRegionOpen: function() {
      this.closed = false;
      this.closing = false;
      this.open = true;
      this.app.vent.trigger( this.moduleName+':open' );
    },
    _shareRegionReady: function() {
      this.ready = true;
      this.closing = false;
      this.app.vent.trigger( this.moduleName+':ready' );
    },
    _shareRegionClosing: function() {
      this.ready = false;
      this.closing = true;
      this.app.vent.trigger( this.moduleName+':closing' );
    },
    _shareRegionClose: function() {
      this.closed = true;
      this.closing = false;
      this.open = false;
      this.ready = false;
      this.app.vent.trigger( this.moduleName+':close' );
    },
    _shareViewUpdating: function() {
      this.app.vent.trigger( this.moduleName+':updating' );
    },
    _shareViewUpdate: function() {
      this.app.vent.trigger( this.moduleName+':update' );
    },
    _isStarted: function() {
      return this._isInitialized;
    },
    _isOpen: function() {
      return this.open;
    },
    _isReady: function() {
      return this.ready;
    },
    _isClosing: function() {
      return this.closing;
    },
    _isClosed: function() {
      return this.closed;
    },

    // Render the region with the item view, if they exist
    show: function() {
      if ( this.region && this.itemView ) {
        this.region.show( this.itemView );
      }
    },

    // Close the region, if it exists
    close: function() {
      if ( this.region ) {
        this.region.close();
      }
    },

    // Set up the global wreqr object
    _configGlobalWreqr: function( options ) {

      this._configGlobalVent( options );
      this._configGlobalCommands( options );
      this._configGlobalRequests( options );

    },

    _configGlobalCommands: function( options ) {

      var name = this.moduleName;

      var defaultCommands = {};
      defaultCommands[name+':show'] = 'show';
      defaultCommands[name+':close'] = 'close';

      var commandsHash = _.extend( defaultCommands, options.commands );
      var method;

      _.each( commandsHash, function(fn, commandName) {
        method = fn;
        if ( !_.isFunction(method) ) {
          method = this[method];
        }
        if ( !method ) {
          return;
        }
        this.app.commands.setHandler( commandName, _.bind( method, this ) );
      }, this);

    },

    _configGlobalRequests: function( options ) {

      var name = this.moduleName;

      var defaultRequests = {};
      defaultRequests[ name+':isStarted' ] = '_isStarted';
      defaultRequests[ name+':isOpen' ] = '_isOpen';
      defaultRequests[ name+':isReady' ] = '_isOpen';
      defaultRequests[ name+':isClosing' ] = '_isOpen';
      defaultRequests[ name+':isClosed' ] = '_isClosed';

      var requestsHash = _.extend( defaultRequests, options.commands );
      var method;

      _.each( requestsHash, function(fn, requestName) {
        method = fn;
        if ( !_.isFunction(method) ) {
          method = this[method];
        }
        if ( !method ) {
          return;
        }
        this.app.reqres.setHandler( requestName, _.bind( method, this ) );
      }, this);

    },

    _configGlobalVent: function( options ) {

      var eventsHash = _.extend( {}, options.events );
      var method;

      _.each( eventsHash, function(fn, eventName) {
        method = fn;
        if ( !_.isFunction(method) ) {
          method = this[method];
        }
        if ( !method ) {
          return;
        }
        this.app.vent.on( eventName, _.bind( method, this ) ); 
      }, this);

    },

    _configProperties: function( options ) {

      var components = [
        'model',
        'region',
        'regionManager',
        'view',
        'itemView',
        'collectionView',
        'compositeView',
        'controller'
      ];

      _.each( components, function(component) {

        if ( options[component] ) {
          this[component] = options[component];
        }

      }, this);

    },

    // Automatically share this wreqr with every component of the module
    _configLocalWreqr: function( options ) {

      var components = [
        'region',
        'regionManager',
        'view',
        'itemView',
        'collectionView',
        'compositeView',
        'controller'
      ];

      var wreqr = {
        vent: this.vent,
        commands: this.commands,
        reqres: this.commands
      };

      _.each( components, function(component) {

        if ( options[component] || this[component] ) {
          this[component] = _.extend( this[component], options[component], wreqr );
        }

      }, this);

    },

  });

  window.Puppets = window.Puppets || {};
  window.Puppets.Puppet = Puppet;

})();