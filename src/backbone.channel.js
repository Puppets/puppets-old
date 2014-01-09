/*
 * Backbone.Channel
 * A means to organize Wreqr instances into channels
 *
 */

 Backbone.Channel = {

  // Set up a channel on this object, defaulting to a new `local` channel
  // Returns the newly created channel
  attachChannel: function( channelName, vent, commands, reqres ) {

    channelName  = channelName  || 'local';

    vent     = vent     || new Backbone.Wreqr.EventAggregator();
    commands = commands || new Backbone.Wreqr.Commands();
    reqres   = reqres   || new Backbone.Wreqr.RequestResponse();

    this._channels = this._channels || {};

    this._channels[channelName] = {
      channelName: channelName,
      vent: vent,
      commands: commands,
      reqres: reqres
    };

    return this._channels[ channelName ];

  },

  resetChannel: function( channelName ) {

    var channel = this.channel( channelName );

    if ( !channel ) {
      return;
    }

    channel.vent.off();
    channel.reqres.removeAllHandlers();
    channel.commands.removeAllHandlers();

  },

  // Safely remove a channel. Pass `true` to
  // shut it down completely
  detachChannel: function( channelName, off ) {

    off = off || false;

    var channel = this.channel( channelName );

    if ( !channel ) {
      return;
    }

    if ( off ) {
      this.resetChannel( channelName );
    }

    delete channel;

  },

  // Return the channel so you can emit events like
  // this.channel('global').vent('eventName')
  channel: function( name ) {
    return this._channels[ name ];
  },

  // Attach events from a hash to a channel, defaulting to local
  attachVent: function( vents, channel ) {

    channel  = channel || 'local';
    vents = this._methodsFromHash( vents );

    _.each( vents, function(fn, ventName) {
      this.channel( channel ).vent.on( ventName, _.bind(fn, this) );
    }, this);

    return this;

  },

  // Attach commands from a hash to a channel, defaulting to local
  attachCommands: function( commandsHash, channel ) {

    channel = channel || 'local';
    commandsHash = this._methodsFromHash( commandsHash );

    _.each( commandsHash, function(fn, commandName) {
      this.channel( channel ).commands.setHandler( commandName, _.bind(fn, this) );
    }, this);

    return this;

  },

  attachRequests: function( requestsHash, channel ) {

    channel = channel || 'local';
    requestsHash = this._methodsFromHash( requestsHash );

    _.each( requestsHash, function(fn, requestName) {
      this.channel( channel ).reqres.setHandler( requestName, _.bind(fn, this) );
    }, this);

    return this;

  },

  // Sets up the listeners on the channel by merging `this._defaultEvents`
  // with `this.channelsHash` and applying them
  _configChannel: function( channel ) {

    if ( !channel ) {
      return;
    }

    var
    channelName = channel.channelName,
    channelVent = channel.vent,
    channelCommands = channel.commands,
    channelReqres = channel.reqres;

    var defaultVent, defaultCommands, defaultRequests, nVent, nCommands, nRequests;

    // Get the default event hash
    if ( this._defaultEvents && this._defaultEvents[channelName] ) {
      var channelDefaults = this._defaultEvents[channelName];
      defaultVent = channelDefaults.vent;
      defaultCommands = channelDefaults.commands;
      defaultRequests = channelDefaults.requests;
    }
    // Get events set up later; perhaps in an `initialize` function
    if ( this.channelsHash ) {
      nVent = this.channelsHash.vent;
      nCommands = this.channelsHash.commands;
      nRequests = this.channelsHash.requests;
    }

    var ventHash = _.extend({}, defaultVent, nVent );
    var commandsHash = _.extend({}, defaultCommands, nCommands );
    var requestsHash = _.extend({}, defaultRequests, nRequests );

    this.attachVent( ventHash, channelName )
        .attachCommands( commandsHash, channelName )
        .attachRequests( requestsHash, channelName );

  },

  // Parse channel hashes of the form
  // {
  //   'someEvent'     : fnReference,
  //   'someOtherEvent': 'fnName'
  // }
  // returning an object of the same form
  // with actual function references (when they exist)
  // instead of strings
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

 };