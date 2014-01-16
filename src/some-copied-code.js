// Copied code
// startChannel: function( channelName ) {
    //   var channel = this.channel( channelName );

    //   if ( !channel ) {
    //     return;
    //   }

    //   var
    //   channelVent = channel.vent,
    //   channelCommands = channel.commands,
    //   channelReqres = channel.reqres;

    //   var defaultVent, defaultCommands, defaultRequests, nVent, nCommands, nRequests;

    //   // Get the default event hash
    //   if ( this._defaultEvents && this._defaultEvents[channelName] ) {
    //     var channelDefaults = this._defaultEvents[channelName];
    //     defaultVent = channelDefaults.vent;
    //     defaultCommands = channelDefaults.commands;
    //     defaultRequests = channelDefaults.requests;
    //   }
    //   // Get events set up later; perhaps in an `initialize` function
    //   if ( this.channelsHashes ) {
    //     var thisChannel = this.channelsHashes[ channelName ];
    //     nVent = thisChannel.vent;
    //     nCommands = thisChannel.commands;
    //     nRequests = thisChannel.requests;
    //   }

    //   var ventHash     = _.extend({}, defaultVent, nVent );
    //   var commandsHash = _.extend({}, defaultCommands, nCommands );
    //   var requestsHash = _.extend({}, defaultRequests, nRequests );

    //   channel.connectEvents( ventHash, channelName )
    //          .connectCommands( commandsHash, channelName )
    //          .connectRequests( requestsHash, channelName );

    // }