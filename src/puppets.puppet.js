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
    this.vent     = this.channels.local.vent;
    this.commands = this.channels.local.commands;
    this.reqres   = this.channels.local.reqres;

    Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );
    this._afterInit( options );

  },

  _attachValue: function( value, state ) {

    console.log( 'lala', value );

  },

  _generateEventsMap: function( statesMap ) {

    var eventsMap = {};

    _.each( statesMap, function(method, state) {

      if ( _.isArray(method) ) {

        _.each( method, function( method ) {
          eventsMap[ method ] = eventsMap[ method ] || [];
          eventsMap[ method ].push( state );
        }, this);

      } else if ( _.isString( method )) {

        eventsMap[ method ] = eventsMap[ method ] || [];
        eventsMap[ method ].push( state )

      }

    }, this);

    return eventsMap;

  },

  _setFsmStates: function( options ) {

    var actions     = options && options.actions;
    var statesMap  = this.statesMap;
    var states     = _.keys( statesMap );
    var controller = this.component( 'controller' );
    var eventsMap = this._generateEventsMap( statesMap );

    // Only continue if we have events set up by the user,
    // and events mapped to states in the puppet,
    // and a controller set up for this puppet
    if ( !actions || !statesMap || !controller ) {
      return;
    }

    console.log( states );

    _.each( actions, function(eventName, action) {

      // Check for transitions first
      if ( _.has( eventsMap, action ) ) {

        var eventInfo = eventsMap[ action ];

        _.each( eventInfo, function( state ) {

          console.log( '~~~', action, state );

          // Set the transition
          if ( _.contains( states, action ) ) {

            console.log("TRANSITION", action);
            this.statesConfig[ state ] = this.statesConfig[ state ] || {};
            this.statesConfig[ state ][ action ] = state;

          }

          // Now check for methods on the controller
          else if ( _.isFunction( controller[action] )) {
            console.log( 'ATTACHED', action );
            this.statesConfig[ state ] = this.statesConfig[ state ] || {};
            this.statesConfig[ state ][ action ] = controller[ action ];
          }

          else {
            console.log('NOT ATTACHED', action);
          }

        }, this);

      }

      // Bind these actions for all states
      else if ( _.isFunction( controller[action] ) ) {
        this.vent.on( eventName, action );
      }

      else {
        console.log('Neither', action);
      }

    }, this);

    // Loop through the events/actions hash that the user has passed us
    // _.each( events, function( eventName, action ) {

    //   // var stateValue;
    //   // var mapValue;

    //   // if ( action.type === 'transition' ) {
    //   //   stateValue = action.newState;
    //   //   mapValue = transitionsMap[ stateValue ];
    //   //   console.log( action, stateValue, mapValue );
    //   //   this._attachTransitionsToStates( mapValue, eventName, stateValue );
    //   // }
    //   // else if ( action.type === 'method' ) {
    //   //   stateValue = action.newState;
    //   //   mapKey = transitionsMap[ stateValue ];
    //   //   this._attachMethodsToStates( mapValue, eventName, stateValue );
    //   // }
      
    //   // this._attachActionsToStates( methodsMap, eventName, action );

    // }, this);

  },

  _attachMethodsToStates: function( mapValue, eventName, methodName ) {

    // Get a handle of the controller
    var controller = this.component( 'controller' );

    if ( !_.isString( methodName ) ) {
      this._throw( 'States must be a string. "' + methodName + '" is not a string on Puppet.' + this.puppetName );
      return;
    } else if ( !mapValue ) {
      this._throw( 'The state "' + mapValue + '" has no associated methods on Puppet.' + this.puppetName );
      return;
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

  _attachTransitionsToStates: function( mapValue, eventName, newState ) {

    // The new state needs to be a string
    if ( !_.isString( newState ) ) {
      this._throw( 'States must be a string. "' + newState + '" is not a string in Puppet.' + this.puppetName );
      return;
    } else if ( !mapValue ) {
      this._throw( 'The state "' + mapValue + '" can not be transitioned to in Puppet.' + this.puppetName );
      return;
    } else if ( !_.contains(this.states, newState) ) {
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