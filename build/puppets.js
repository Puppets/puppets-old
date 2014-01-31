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
 * It sets up the components of the module,
 * and speaks to the Application via the global channel (Application.vent, etc.)
 *
 */

window.Puppets = window.Puppets || {};

window.Puppets.Puppet = Marionette.Module.extend({

  constructor: function( puppetName, app, options ){

    this.app = app;

    options = options || {};

    // Start up the fsm
    // this.fsm = new Puppets.Fsm({
    //   namespace: 'Puppets.' + this.puppetName
    // });
        console.log('1');


    // Attach references to useful channels
    this.globalChannel    = Backbone.radio.channel( 'global' );
    this.localChannel     = Backbone.radio.channel( 'Puppets.' + puppetName );
    this.fsmEventsChannel = Backbone.radio.channel( 'Puppets.' + puppetName + '.events' );

    // this._configRegion( options );

    Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );
        console.log('3');

    // Configure the local and global channels after the user is
    // given the opportunity to add events in `initialize()`
    // this.startChannel( localChannel );
    // this.startChannel( globalChannel );

    // After the user's initialize function has run, set up the components
    // this._components = {};
    // this._linkComponents();
    // this.configureComponents( options );

  },

  // This function is called after the components have been set up.
  // // Overwrite it to pass options to the components
  // configureComponents: function() {},

  // // Apply the default settings to the region, if one is specified
  // _configRegion: function( options ) {

  //   if ( !options.region ) {
  //     return;
  //   }
  //   // Set the region as a component
  //   this.component('region', options.region);
  //   // Retrieve the newly-added region
  //   var region = this.component('region');
  //   // Set some properties on it based on the options
  //   region.duration = options.duration || Puppets.Region._defaultDuration;
  //   region.transition = options.transition || Puppets.Region._defaultTransition;

  // },

  // // Get & set components
  // component: function( name, object ) {

  //   // If there's no object, then retrieve the component
  //   if ( !object ) {
  //     return this._components[name];
  //   }
  //   // Return false if the component has already been set; they can't be overwritten (yet)
  //   else if ( _.has( this._components, name ) ) {
  //     return false;
  //   }
  //   // Otherwise, add a new component
  //   else {
  //     this._components[name] = object;
  //   }

  // },

  // Gives the component the local vent and access to the componecrnts
  // _linkComponents: function() {

  //   var localChannel = this.channel( 'local' );

  //   if (!this.components) {
  //     return;
  //   }
  //   _.each(this.components, function(component, name) {

  //     // Give them names and access to the local wreqr channel
  //     component.componentName = name;
  //     component.puppetName = this.puppetName;

  //     // Set up the local channel on the component
  //     _.extend(component, Backbone.WreqrChannel);
  //     component.attachChannel(
  //       'local',
  //       localChannel.vent,
  //       localChannel.commands,
  //       localChannel.reqres
  //     );
  //     // Attach the component
  //     this.component( name, component );

  //   }, this);

  // },

  // // Default reactions to region events
  // _startedPuppet: function() {
  //   this._changeState( 'started' );
  //   this.emitGlobalEvent('start');
  // },
  // _readyPuppet: function() {
  //   this._changeState( 'ready' );
  //   this.emitGlobalEvent('ready');
  // },
  // _stoppingPuppet: function() {
  //   this._changeState( 'stopping' );
  //   this.emitGlobalEvent('closing');
  // },
  // _stoppedPuppet: function() {
  //   this._changeState( 'stopped' );
  //   this.emitGlobalEvent('close');
  // },
  // _shareViewUpdating: function() {
  //   this.emitGlobalEvent('updating');
  // },
  // _shareViewUpdate: function() {
  //   this.emitGlobalEvent('update');
  // },

  // // Render the region with the item view, if they exist
  // start: function() {
  //   if ( this.region && this.itemView ) {
  //     this.region.show( this.itemView );
  //   }
  // },

  // // Close the region, if it exists
  // stop: function() {
  //   if ( this.region ) {
  //     this.region.close();
  //   }
  // },

  // _defaultEvents: {
  //   local: {
  //     vent: {
  //       'open:region': '_startedPuppet',
  //       'ready:region': '_readyPuppet',
  //       'closing:region': '_stoppingPuppet',
  //       'close:region': '_stoppedPuppet'
  //     }
  //   },
  //   global: {
  //     commands: {
  //       'start': 'start',
  //       'stop' : 'stop'
  //     },
  //     requests: {
  //       'isStarted' : '_isStarted',
  //       'isReady'   : '_isReady',
  //       'isStopping': '_isStopping',
  //       'isStopped' : '_isStopped'
  //     }
  //   }
  // },

  // // Adds the :puppets.[puppetName] suffix to an event type
  // _suffixEventName: function( eventType ) {
  //   return eventType + ':puppets.'+this.puppetName;
  // },

  // // Share a suffixed event globally
  // emit: function( eventName ) {

  //   arguments[0] = this._suffixEventName( eventName );
  //   this.app.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  // }

});