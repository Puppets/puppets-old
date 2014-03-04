/*
 * Wreqr Radio
 * -----------
 * v1.2.0
 *
 * Copyright (c) 2014 Jmeas
 * Distributed under the MIT license
 *
 */

(function (root, factory) {
  if ( typeof define === 'function' && define.amd ) {

    // AMD. Register as an anonymous module.
    define( ['underscore', 'backbone'], function (_, backbone) {
        return ( root.WreqrRadio = factory(_, backbone) );
    });

  } else if ( typeof exports === 'object' ) {

    var
    _ = require( 'underscore' ),
    Backbone = require( 'backbone' );

    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory( _, Backbone );

  } else {
    // Browser globals
    root.Backbone.Wreqr = root._.extend( root.Backbone.Wreqr, factory(root._, root.Backbone) );
    root.Backbone.radio = root.Backbone.Wreqr.radio;
  }
}(this, function (_, Backbone) {

  var WreqrRadio = (function(_, Backbone, undefined) {
  
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
    connectEvents: function( hash, context ) {
      this._connect( 'vent', hash, context );
      return this;
    },
    connectCommands: function( hash, context ) {
      this._connect( 'commands', hash, context );
      return this;
    },
    connectRequests: function( hash, context ) {
      this._connect( 'reqres', hash, context );
      return this;
    },
  
    // Attach the handlers to a given message system `type`
    _connect: function( type, hash, context ) {
  
      if ( !hash ) { return; }
      context = context || this;
      var method = ( type === 'vent' ) ? 'on' : 'setHandler';
      _.each( hash, function(fn, eventName) {
        this[type][method]( eventName, _.bind(fn, context) );
      }, this);
  
    }
  
    });
  
    var WreqrRadio = {
  
      radio: radio,
      Channel: Channel,
      VERSION: '1.2.0'
  
    };
  
    return WreqrRadio;
  
  })( _, Backbone );

  return WreqrRadio;

}));
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

      this._configurePieces();
      this._initDefaultListeners();

      Marionette.Module.prototype.constructor.apply( this, Array.prototype.slice.call(arguments, 0) );

      this._addFinalizers();

    },

    _addFinalizers: function() {

      // Reset the channel
      this.addFinalizer( function() {
        this.channels.local.reset();
      });

      // Shut down the pieces
      this.addFinalizer( function() {

        _.each( this._pieces, function(piece) {
          if ( piece.off ) {
            piece.off();
          }
          if ( piece.close ) {
            piece.close();
          } else if ( piece.remove ) {
            piece.remove();
          }
        }, this);

      });

    },

    resetChannel: function() {
      this.channels.local.reset();
    },

    // Create and set up our pieces
    _configurePieces: function() {

      this._pieces = {};

      _.each( this.pieces, function(pieceClass, pieceName) {

        this._createNewPiece( pieceClass, pieceName );

      }, this);

    },

    _createNewPiece: function( PieceClass, pieceName ) {

      var newPiece;
      if ( PieceClass.prototype instanceof Backbone.Model || PieceClass.prototype instanceof Backbone.Collection ) {
        newPiece = this._pieces[ pieceName ] = new PieceClass( undefined, this._options );
      } else {
        newPiece = this._pieces[ pieceName ] = new PieceClass( this._options );
      }
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
      return 'puppet.' + this.puppetName;
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
        .connectEvents( eventsHash.vent, this )
        .connectCommands( eventsHash.commands, this )
        .connectRequests( eventsHash.reqres, this );

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

