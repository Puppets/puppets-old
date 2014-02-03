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

    options = options || {};

    // Start up the fsm
    this.fsm = new Puppets.Fsm({
      namespace: 'Puppets.' + this.puppetName
    });

    // Attach references to useful channels
    this.channels = {
      global:       Backbone.radio.channel( 'global' ),
      local:        Backbone.radio.channel( 'puppets.' + puppetName ),
      'fsm.events': Backbone.radio.channel( 'puppets.' + puppetName + '.events' )
    };

    this.controller = new Puppets.Controller();

    Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );
    this._afterInit();

  },

  // This code runs after the user's extended Puppet is defined. Use this as an opportunity to handle that
  // Puppet's options
  _afterInit: function() {

    // this._linkComponents();

    // Configure the local and global channels after the user is
    // given the opportunity to add events in `initialize()`

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

  // Adds the :puppets.[puppetName] suffix to an event type
  _suffixEventName: function( eventType ) {
    return eventType + ':puppets.' + this.puppetName;
  },

  // Share a suffixed event globally
  emit: function( eventName ) {

    arguments[0] = this._suffixEventName( eventName );
    this.channels.global.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  }

});