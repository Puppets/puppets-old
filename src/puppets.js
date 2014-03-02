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

