/*
 *
 * Puppets.Puppet
 * --------------
 * The base module from which all Puppets extend
 * It sets up the pieces of the module,
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
        local:  Backbone.radio.channel( this.channelName )
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

      this._initDefaultListeners();

      // Load up the pieces of this puppet
      this._configurePieces();

    },

    // Create and set up our pieces
    _configurePieces: function() {

      this._pieces = {};

      _.each( this.pieces, function(pieceClass, pieceName) {

        this._createNewPiece( pieceClass, pieceName );

      }, this);

    },

    _createNewPiece: function( PieceClass, pieceName ) {

      var newPiece = this._pieces[ pieceName ] = new PieceClass( this._options );
      this._setUpNewPiece( newPiece, pieceName );

    },

    _setUpNewPiece: function( newPiece, pieceName ) {

      newPiece.pieceName = pieceName;
      newPiece.channelName = this.channelName;
      newPiece.puppetName = this.puppetName;
      newPiece.channels = this.channels;
      newPiece.normalizeMethods = newPiece.normalizeMethods || this.normalizeMethods;
      newPiece.localEvents = newPiece.normalizeMethods( newPiece.localEvents );

      this._attachEvents( this.channelName, newPiece.localEvents );
      this._attachMessagingProtocols( newPiece, this.channels.local );
      this._listenToPieceEvents( newPiece );

    },

    // Get & set pieces
    piece: function( name, object ) {

      // If there's no object, then retrieve the piece
      if ( !object ) {
        return this._pieces[ name ];
      }
      // Return false if the piece has already been set; they can't be overwritten (yet)
      else if ( _.has(this._pieces, name) ) {
        return false;
      }
      // Otherwise, add a new piece
      else {
        this._pieces[ name ] = object;
        this._setUpNewPiece( object );
        return object;
      }

    },

    // Binds events from the pieces to the vent
    _listenToPieceEvents: function( piece ) {

      if ( _.matches(piece, Backbone.Events) ) {
        this.listenTo( piece, 'all', _.bind(this._forwardPieceEvent, this, piece.pieceName) );
      }

    },

    // Forwards events on an piece's vent to the local vent
    // under the pieceName namespace
    _forwardPieceEvent: function() {

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

      eventsHash = eventsHash || {};

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

