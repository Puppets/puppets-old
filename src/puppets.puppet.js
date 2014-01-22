/*
 *
 * Puppets.Puppet
 * --------------
 * The base module from which all Puppets extend
 * It sets up the components of the module,
 * and speaks to the Application via the global channel (Application.vent, etc.)
 *
 */

window.Puppets.Puppet = Marionette.Module.extend({

  constructor: function( name, app, options ){

    this.puppetName = name;
    this.app = app;

    options = options || {};

    this.configureLocalChannel();
    this.configureGlobalChannel();

    // Create the local and global channel, then configure them
    var localChannel = new Backbone.WreqrChannel( 'local' );
    var globalChannel = new Backbone.WreqrChannel( 'global', this.app.vent, this.app.commands, this.app.reqres );
    var localChannel  = this.attachChannel( localChannel );
    var globalChannel = this.attachChannel( globalChannel );

    this.fsm = new Puppets.Fsm();

    this._configRegion( options );

    Marionette.Controller.prototype.constructor.apply(this, Array.prototype.slice(arguments));

    // Configure the local and global channels after the user is
    // given the opportunity to add events in `initialize()`
    // this.startChannel( localChannel );
    // this.startChannel( globalChannel );

    // After the user's initialize function has run, set up the components
    this._components = {};
    this._linkComponents();
    this.configureComponents( options );

  },

  configureLocalChannel: function() {
    var localChannel = new Backbone.WreqrChannel( name );
    this.attachChannel( localChannel );
  },

  configureGlobalChannel: function() {
    var globalChannel = this.attachChannel( 'global', this.app.vent, this.app.commands, this.app.reqres );

  },

  // This function is called after the components have been set up.
  // Overwrite it to pass options to the components
  configureComponents: function() {},

  // Apply the default settings to the region, if one is specified
  _configRegion: function( options ) {

    if ( !options.region ) {
      return;
    }
    // Set the region as a component
    this.component('region', options.region);
    // Retrieve the newly-added region
    var region = this.component('region');
    // Set some properties on it based on the options
    region.duration = options.duration || Puppets.Region._defaultDuration;
    region.transition = options.transition || Puppets.Region._defaultTransition;

  },

  // Get & set components
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
    }

  },

  // Gives the component the local vent and access to the componecrnts
  _linkComponents: function() {

    var localChannel = this.channel( 'local' );

    if (!this.components) {
      return;
    }
    _.each(this.components, function(component, name) {

      // Give them names and access to the local wreqr channel
      component.componentName = name;
      component.puppetName = this.puppetName;

      // Set up the local channel on the component
      _.extend(component, Backbone.WreqrChannel);
      component.attachChannel(
        'local',
        localChannel.vent,
        localChannel.commands,
        localChannel.reqres
      );
      // Attach the component
      this.component( name, component );

    }, this);

  },

  // Default reactions to region events
  _startedPuppet: function() {
    this._changeState( 'started' );
    this.emitGlobalEvent('start');
  },
  _readyPuppet: function() {
    this._changeState( 'ready' );
    this.emitGlobalEvent('ready');
  },
  _stoppingPuppet: function() {
    this._changeState( 'stopping' );
    this.emitGlobalEvent('closing');
  },
  _stoppedPuppet: function() {
    this._changeState( 'stopped' );
    this.emitGlobalEvent('close');
  },
  _shareViewUpdating: function() {
    this.emitGlobalEvent('updating');
  },
  _shareViewUpdate: function() {
    this.emitGlobalEvent('update');
  },

  // Render the region with the item view, if they exist
  start: function() {
    if ( this.region && this.itemView ) {
      this.region.show( this.itemView );
    }
  },

  // Close the region, if it exists
  stop: function() {
    if ( this.region ) {
      this.region.close();
    }
  },

  _defaultEvents: {
    local: {
      vent: {
        'open:region': '_startedPuppet',
        'ready:region': '_readyPuppet',
        'closing:region': '_stoppingPuppet',
        'close:region': '_stoppedPuppet'
      }
    },
    global: {
      commands: {
        'start': 'start',
        'stop' : 'stop'
      },
      requests: {
        'isStarted' : '_isStarted',
        'isReady'   : '_isReady',
        'isStopping': '_isStopping',
        'isStopped' : '_isStopped'
      }
    }
  },

  // Adds the :puppets.[puppetName] suffix to an event type
  _suffixEventName: function( eventType ) {
    return eventType + ':puppets.'+this.puppetName;
  },

  // Share a suffixed event globally
  emit: function( eventName ) {

    arguments[0] = this._suffixEventName( eventName );
    this.app.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  }

});

// Make sure that all Puppets are WreqrStations
_.extend( window.Puppets.Puppet.prototype, Backbone.WreqrStation );

