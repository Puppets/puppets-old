/*
 * backbone.wreqr-radio
 * An organizational system for handling multiple Wreqr instances
 *
 */

// Set this up for the appropriate environment
(function(root, factory) {

  // AMD
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone', 'exports'], function(_, backbone, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, backbone);
    });

  // Node / CommonJS
  } else if (typeof exports !== 'undefined') {

    var
    _ = require('underscore'),
    Backbone = require('backbone');

    factory(root, exports, _, Backbone);

  // Otherwise, as a global variable
  } else {
    root.Backbone.Wreqr = root._.extend( root.Backbone.Wreqr, factory(root, {}, root._, root.Backbone) );
    root.Backbone.radio = root.Backbone.Wreqr.radio;
  } 

}(this, function(root, WreqrChannel, _, Backbone) {

  'use strict';

  var radio = {

    _channels: {},

    vent: {},
    commands: {},
    reqres: {},

    // Get a channel
    channel: function( channelName ) {
      
      channelName = channelName || '/';
      return this._getChannel( channelName );

    },

    // Return the channel if it exists; otherwise make a new one
    _getChannel: function( channelName ) {

      var channel;

      if ( !_.has(this._channels, channelName) ) {
        channel = new Channel( channelName );
        this._channels[ channelName ] = channel;
      } else {
        channel = this._channels[ channelName ];
      }

      return channel;

    },

    _forwardFn: function( channelName, ms, fn ) {

      ms = this._getChannel( channelName )[ ms ];
      var args = Array.prototype.slice.call( arguments, 3 );

      ms[fn].apply( ms, args );

    }

  };

  var methods = {
    vent: [
      'on',
      'off',
      'trigger',
      'once',
      'stopListening',
      'listenTo',
      'listenToOnce'
    ],
    handler: [
      'setHandler',
      'setHandlers',
      'removeHandler',
      'removeAllHandlers'
    ],
    commands: [
      'execute'
    ],
    reqres: [
      'request',
    ]
  };

  var vent     = methods.vent;
  var commands = _.union( methods.commands, methods.handler );
  var reqres   = _.union( methods.reqres, methods.handler );

  _.each( vent, function( fn ) {
    radio.vent[fn] = function( channelName ) {
      var args = Array.prototype.slice.call( arguments, 1 );
      args.unshift( channelName, 'vent', fn );
      radio._forwardFn.apply( radio, args );
    };
  });

  _.each( commands, function( fn ) {
    radio.commands[fn] = function( channelName ) {
      var args = Array.prototype.slice.call( arguments, 1 );
      args.unshift( channelName, 'commands', fn );
      radio._forwardFn.apply( radio, args );
    };
  });

  _.each( reqres, function( fn ) {
    radio.reqres[fn] = function( channelName ) {
      var args = Array.prototype.slice.call( arguments, 1 );
      args.unshift( channelName, 'reqres', fn );
      radio._forwardFn.apply( radio, args );
    };
  });

  var Channel = function( channelName ) {

    this.vent        = new Backbone.Wreqr.EventAggregator();
    this.reqres      = new Backbone.Wreqr.RequestResponse();
    this.commands    = new Backbone.Wreqr.Commands();
    this.channelName = channelName;

  };

  _.extend( Channel.prototype, {

    // Remove all handlers from the messaging systems of this channel
    reset: function() {

      this.vent.off();
      this.vent.stopListening();
      this.reqres.removeAllHandlers();
      this.commands.removeAllHandlers();
      return this;

    },

    // Connect a hash of events; one for each messaging system
    connectEvents: function( hash ) {
      this._connect( 'vent', hash );
      return this;
    },
    connectCommands: function( hash ) {
      this._connect( 'commands', hash );
      return this;
    },
    connectRequests: function( hash ) {
      this._connect( 'reqres', hash );
      return this;
    },

    // Attach the handlers to a given message system `type`
    _connect: function( type, hash ) {

      if ( !hash ) { return; }
      hash = this._normalizeMethods( hash );
      var method = ( type === 'vent' ) ? 'on' : 'setHandler';
      _.each( hash, function(fn, eventName) {
        this[type][method]( eventName, _.bind(fn, this) );
      }, this);

    },

    _attach: function( type, method, eventName, fn ) {
      this[type][method]( eventName, _.bind(fn, this) );
    },

    // Parse channel hashes of the form
    // {
    //   'someEvent'     : fnReference,
    //   'someOtherEvent': 'fnName'
    // }
    // returning an object of the same form
    // with actual function references (when they exist)
    // instead of strings
    _normalizeMethods: function( hash ) {

      var newHash = {}, method;
      _.each( hash, function(fn, eventName) {
        method = fn;
        if ( !_.isFunction(method) ) {
          method = this[method];
        }
        if ( !method ) {
          return;
        }
        newHash[eventName] = method;
      }, this);
      return newHash;

    }

  });

  var WreqrExtension = {};
  WreqrExtension.radio = radio;
  WreqrExtension.Channel = Channel;

  return WreqrExtension;

}));
/*
 *
 * Puppets.Puppet
 * --------------
 * The base module from which all Puppets extend
 * It sets up the elements of the module,
 * and speaks to the Application via the global channel (Application.vent, etc.)
 *
 */

(function() {

  'use strict';

  window.Puppets = window.Puppets || {};

  window.Puppets.Puppet = Marionette.Module.extend({

    constructor: function( puppetName, app, options ){

      this.app = app;
      this.puppetName = puppetName;
      this.channelName = this._channelName();

      this._options = options || {};

      // Attach references to relevant channels
      this.channels = {
        global: Backbone.radio.channel( 'global' ),
        local:  Backbone.radio.channel( this.channelName ),
      };
      this._attachMessagingProtocols( this, this.channels.local );

      Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );

      this._afterInit();

    },

    // After the initialize function runs,
    // Run some final set up on the puppet
    _afterInit: function() {

      this.addFinalizer(function() {
        this.channels.local.reset();
      });

      this.globalEvents = this.globalEvents || {};
      this.localEvents  = this.localEvents || {};
      this._initDefaultListeners();

      // Load up the elements of this puppet
      this._configureElements();

    },

    // Create and set up our elements
    _configureElements: function() {

      this._elements = {};

      _.each( this.elements, function( elementClass, elementName ) {

        this._createNewElement( elementClass, elementName );

      }, this);

    },

    _createNewElement: function( ElementClass, elementName ) {

      var newElement = this._elements[ elementName ] = new ElementClass( this._options );
      this._setUpNewElement( newElement, elementName );

    },

    _setUpNewElement: function( newElement, elementName ) {

      newElement.channels = this.channels;
      newElement.elementName = elementName;
      newElement.channelName = this.channelName;
      newElement.puppetName = this.puppetName;
      newElement.normalizeMethods = newElement.normalizeMethods || this.normalizeMethods;
      newElement.localEvents = newElement.localEvents || {};
      newElement.localEvents = newElement.normalizeMethods( newElement.localEvents );
      this._attachEvents( this.channelName, newElement.localEvents );
      this._attachMessagingProtocols( newElement, this.channels.local );
      this._listenToElementEvents( newElement );

    },

    // Get & set elements
    element: function( name, object ) {

      // If there's no object, then retrieve the element
      if ( !object ) {
        return this._elements[name];
      }
      // Return false if the element has already been set; they can't be overwritten (yet)
      else if ( _.has( this._elements, name ) ) {
        return false;
      }
      // Otherwise, add a new element
      else {
        this._elements[name] = object;
        this._setUpNewElement( object );
        return object;
      }

    },

    // Binds events from the elements to the vent
    _listenToElementEvents: function( element ) {

      if ( _.matches(element, Backbone.Events) ) {
        this.listenTo( element, 'all', _.bind( this._forwardElementEvent, this, element.elementName ) );
      }

    },

    // Forwards events on an element's vent to the local vent
    // under the elementName namespace
    _forwardElementEvent: function() {

      var args = Array.prototype.slice.call( arguments, 0 );
      args[ 1 ] = args[ 1 ] + ':' + args[ 0 ];
      args.shift();
      this.vent.trigger.apply( this.vent, args );

    },

    _attachMessagingProtocols: function( obj, channel ) {

      obj.commands = channel.commands;
      obj.reqres = channel.reqres;
      obj.vent = channel.vent;

    },

    _channelName: function() {
      return 'puppets.' + this.puppetName;
    },

    _initDefaultListeners: function() {

      this._normalizeEventsGroup( this.localEvents );
      this._normalizeEventsGroup( this.globalEvents );
      this._attachEvents( this.channelName, this.localEvents );
      this._attachEvents( 'global', this.globalEvents );

    },

    _normalizeEventsGroup: function( eventsGroup ) {

      _.each( eventsGroup, function(eventsHash, protocol) {
        eventsGroup[ protocol ] = this.normalizeMethods( eventsHash );
      }, this);

    },

    _attachEvents: function( channelName, eventsHash ) {

      Backbone.radio.channel( channelName )
        .connectEvents( eventsHash.vent )
        .connectCommands( eventsHash.commands )
        .connectRequests( eventsHash.reqres );

    },

    // Share a suffixed event globally
    emit: function( eventName ) {

      var args = Array.prototype.slice.apply( arguments );
      args[0] = this._suffixEventName( eventName );
      this.channels.global.vent.trigger.apply( this.app.vent, args );

    },

    // Adds the channelName suffix to an global event type
    _suffixEventName: function( eventType ) {
      return eventType + ':' + this.channelName;
    },

    normalizeMethods: Marionette.normalizeMethods

  }, Backbone.Events);


})();

