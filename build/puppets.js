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
(function() {

  var Fsm = machina.Fsm.extend({
    initialize: function() {
      console.log('Init');
      // do stuff here if you want to perform more setup work
      // this executes prior to any state transitions or handler invocations
    },
    initialState: "stopped",
    states: {
      stopped: {
        _onEnter: function() {
          console.log('Stopped');
        },
        'some:event': 'started',
        'lala': function() {
          console.log( 'RECEIVED' );
        }
      },
      started: {
        _onEnter: function() {
          console.log('Started');
        }
      }
    }
  });

  window.Puppets = window.Puppets || {};
  window.Puppets.Fsm = Fsm;

})();
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
    this.puppetName = puppetName;
    this.statesConfig = {};

    options = options || {};

    // Attach references to useful channels
    this.channels = {
      global:       Backbone.radio.channel( 'global' ),
      local:        Backbone.radio.channel( 'puppets.' + puppetName ),
      'fsm.events': Backbone.radio.channel( 'puppets.' + puppetName + '.events' )
    };

    Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );
    this._afterInit( options );

  },

  _setFsmStates: function( options ) {

    var events     = options && options.events;
    var methodsMap = this.methodsMap;
    var transitionsMap = this.transitionsMap;
    var controller = this.component( 'controller' );
    var associatedStates;

    // Only continue if we have events set up by the user,
    // and events mapped to states in the puppet,
    // and a controller set up for this puppet
    if ( !events || !methodsMap || !transitionsMap || !controller ) {
      return;
    }

    // Loop through the events/actions hash that the user has passed us
    _.each( events, function( action, eventName ) {

      var stateValue;
      var mapValue;

      if ( action.type === 'transition' ) {
        stateValue = action.newState;
        mapValue = transitionsMap[ stateValue ];
        console.log( action, stateValue, mapValue );
        this._attachTransitionsToStates( mapValue, eventName, stateValue );
      }
      else if ( action.type === 'method' ) {
        stateValue = action.newState;
        mapKey = transitionsMap[ stateValue ];
        // this._attachTransitionsToStates( transitionsMap, eventName, stateValue );

      }
      
      this._attachActionsToStates( methodsMap, eventName, action );

    }, this);

  },

  _attachTransitionsToStates: function( mapValue, eventName, newState ) {

    // The new state needs to be a string
    if ( !_.isString( newState ) ) {
      this._throw( 'States must be a string. "' + newState + '" is not a string in Puppet.' + this.puppetName );
      return;
    }

    // You need to be able to transition to the state
    else if ( !mapValue ) {
      this._throw( 'The state "' + mapValue + '" can not be transitioned to in Puppet.' + this.puppetName );
      return;
    }

    // The state needs to be a valid state
    else if ( !_.contains(this.states, newState) ) {
      this._throw( '"' + newState + '" is not a valid state for Puppet.' + this.puppetName );
    }

    if ( mapValue === '*' ) {
      console.log( newState + " is transitioned to from all states" );
    }

    if ( _.isString(mapValue) ) {
      this._attachTransitionToState( mapValue, newState, eventName );
    }

    else if ( _.isArray(mapValue) ) {
      _.each( mapValue, function(fromState) {
        this._attachTransitionToState( fromState, newState, eventName );
      }, this);
    }

  },

  _attachTransitionToState: function( fromState, toState, eventName ) {

    this.statesConfig[ fromState ] = this.states[ fromState ] || {};
    this.statesConfig[ fromState ][ eventName ] = toState;

  },

  _attachMethodToState: function( state, eventName, cbName ) {

    var controller = this.component( 'controller' );
    var cb = controller[ cbName ];

    // If the method doesn't exist on the controller, then ignore it
    if ( !_.isFunction(cb) ) {
      this._throw( cbName + ' not found on the controller of Puppet.' + this.puppetName );
      return; 
    }

    // this.states[ state ] = this.states[ state ] || {};
    // this.states[ state ][ eventName ] = cb;

  },

  _attachActionsToStates: function( methodsMap, eventName, action ) {

    // This is the value we attach to the event on the Fsm.
    // A string for a transition; a function otherwise
    var stateValue;
    // Get a handle of the controller
    var controller = this.component( 'controller' );

    if ( action.type === 'transition' ) {
      stateValue = action.newState;
    } else if ( action.type === 'method' ) {
      stateValue = controller[ action.methodName ];
    }

    // This method is always fired
    // if ( states === '*' ) {
    //   console.log( 'Always fired:', action );
    // }


    // // Attach the method to a single state
    // else if ( _.isString( states ) ) {
    //   // this._attachMethodToState( states, eventName, action );
    // }

    // // Attach the method to an array of states
    // else if ( _.isArray( states ) ) {
    //   // _.each( states, function(state) {
    //   //   console.log( 'The state is', state, eventName, action );
    //   //   this._attachMethodToState( state, eventName, action );
    //   // }, this);
    // }

  },

  // After the initialize function runs,
  // Run some final set up on the puppet
  _afterInit: function( options ) {

    // Load up the components of this puppet
    this._configureComponents();

    // Get the states object for the Fsm
    this._setFsmStates( options );

    // Start up the fsm
    this.fsm = new Puppets.Fsm({
      namespace: 'puppets.' + this.puppetName
    });

  },

  // Give the components access to the channels
  _configureComponents: function() {

    var newComponent;
    this._components = {};

    _.each( this.components, function( component, name ) {
      // Instantiate the component, passing it our options
      newComponent = this._components[ name ] = new component( this.options );
      // Give it access to the same channels
      newComponent.channels = this.channels;
      newComponent.componentName = name;
      newComponent.puppetName = this.puppetName;
    }, this);

  },

  // // Get & set components
  component: function( name, object ) {

    // If there's no object, then retrieve the component
    if ( !object ) {
      return this._components[name];
    }
    // Return false if the component has already been set; they can't be overwritten (yet)
    else if ( _.has( this._components, name ) ) {
      return false;
    }
    // Otherwise, add a new component
    else {
      this._components[name] = object;
      return object;
    }

  },

  _defaultRequests: function() {

    return {};

  },

  // Adds the :puppets.[puppetName] suffix to an event type
  _suffixEventName: function( eventType ) {
    return eventType + ':puppets.' + this.puppetName;
  },

  _throw: function( msg, type ) {

    type = type || 'warn';

    if ( console && console[type] ) {
      console[type]( 'Warning:', msg );
    }

  },

  // Share a suffixed event globally
  emit: function( eventName ) {

    arguments[0] = this._suffixEventName( eventName );
    this.channels.global.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  }

});