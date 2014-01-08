/*
 *
 * This file configures the local & global wreqr channels
 * for this puppet, with defaults
 *
 */

 _.extend( window.Puppets.Puppet.prototype, {

  // A mapping of the default local and global events for this puppet
  // Overwrite them via window.Puppets.Puppet.prototype.[name]
  _defaultLocalEvents: {
    'open:region': '_startedPuppet',
    'ready:region': '_readyPuppet',
    'closing:region': '_stoppingPuppet',
    'close:region': '_stoppedPuppet' 
  },
  _defaultLocalRequests: {},
  _defaultLocalCommands: {},

  _defaultGlobalCommands: {
    'start' : 'start',
    'stop': 'stop'
  },
  _defaultGlobalRequests: {
    'isStarted' : '_isStarted',
    'isReady'   : '_isReady',
    'isStopping': '_isStopping',
    'isStopped' : '_isStopped'
  },
  _defaultGlobalEvents: {},

  // Processes the defaults above
  _getDefaultNames: function( defaults ) {
    var defaultNames = {};
    var eventSuffix = ':puppets.'+this.puppetName;
    _.each( defaults, function(fnName, eventName) {

      eventName = eventName+eventSuffix;
      defaultNames[eventName] = fnName;

    }, this);
    return defaultNames;
  },

  _configEvents: function( options ) {

    this._configLocalWreqr();
    this._configGlobalWreqr( options );

  },

  _setLocalWreqr: function() {

    this.localVent = new Backbone.Wreqr.EventAggregator();
    this.localCommands = new Backbone.Wreqr.Commands();
    this.localReqres = new Backbone.Wreqr.RequestResponse();

  },

  // Set up the local communication channel
  _configLocalWreqr: function() {

    var defaultEvents = _.extend( this._defaultLocalEvents, this.localEventsHash );
    defaultEvents = this._methodsFromHash( defaultEvents );

    var defaultRequests = _.extend( this._defaultLocalRequests, this.localRequestsHash );
    defaultRequests = this._methodsFromHash( defaultRequests );

    var defaultCommands = _.extend( this._defaultLocalCommands, this.localCommandsHash );
    defaultCommands = this._methodsFromHash( defaultCommands );

    _.each( defaultEvents, function( fn, eventName ) {
      this.localVent.on( eventName, _.bind(fn, this) );
    }, this);
    _.each( defaultCommands, function( fn, eventName ) {
      this.localCommands.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( defaultRequests, function( fn, eventName ) {
      this.localReqres.setHandler( eventName, _.bind(fn, this) );
    }, this);

  },

  // Set up the global wreqr object
  _configGlobalWreqr: function( options ) {

    var defaultCommands = this._getDefaultNames( this._defaultGlobalCommands );
    var defaultRequests = this._getDefaultNames( this._defaultGlobalRequests );
    var defaultEvents   = this._getDefaultNames( this._defaultGlobalEvents );

    var globalCommands = _.extend( {}, defaultCommands, options.commands );
    var globalRequests = _.extend( {}, defaultRequests, options.requests );
    var globalEvents   = _.extend( {}, defaultEvents,  options.events );

    var commandsFns = this._methodsFromHash( globalCommands );
    var requestsFns = this._methodsFromHash( globalRequests );
    var eventsFns   = this._methodsFromHash( globalEvents );

    _.each( commandsFns, function( fn, eventName ) {
      this.app.commands.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( requestsFns, function( fn, eventName ) {
      this.app.reqres.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( eventsFns, function( fn, eventName ) {
      this.app.vent.on( eventName, _.bind(fn, this) );
    }, this);

  },

  // Take in a hash of eventName:functionName, and return a hash of
  // eventName:actualFunction
  _methodsFromHash: function( hash ) {

    var newHash = {};
    _.each( hash, function(fn, name) {
      method = fn;
      if ( !_.isFunction(method) ) {
        method = this[method];
      }
      if ( !method ) {
        return;
      }
      newHash[name] = method;
    }, this);
    return newHash;

  },

  // Adds the :puppets.[puppetName] suffix to an event type
  _suffixEventName: function( eventType ) {
    return eventType + ':puppets.'+this.puppetName;
  },

  // Share an event globally
  emitGlobalEvent: function( eventName ) {

    arguments[0] = this._suffixEventName( eventName );
    this.app.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  }

});

