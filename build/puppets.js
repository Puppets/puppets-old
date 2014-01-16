/*
 * Backbone.Channel
 * An organizational system for handling multiple Wreqr instances
 *
 */

// Set up WreqrChannel for the appropriate environment
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
    root.Backbone = root._.extend( root.Backbone, factory(root, {}, root._, root.Backbone) );
  } 

}(this, function(root, WreqrChannel, _, Backbone) {

  var Wreqr = Backbone.Wreqr;

  Backbone.WreqrChannel = {

    // Set up a channel on this object, defaulting to a new `local` channel
    // Returns the newly created channel
    attachChannel: function( channelName, vent, commands, reqres ) {

      channelName  = channelName  || 'local';

      vent     = vent     || new Wreqr.EventAggregator();
      commands = commands || new Wreqr.Commands();
      reqres   = reqres   || new Wreqr.RequestResponse();

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

      // Reset all channels if no name is supplied
      if ( !channelName ) {
        _.each( this._channels, function(channel) {
          console.log('Resetting', channel);
          this.resetChannel( channel.channelName );
        }, this);
      }

      // Otherwise, reset the specified channel
      var channel = this.channel( channelName );

      if ( !channel ) {
        return;
      }

      channel.vent.off();
      channel.reqres.removeAllHandlers();
      channel.commands.removeAllHandlers();

    },

    // Safely remove a channel. Pass `true` to
    // remove all listeners from the channel
    detachChannel: function( channelName, off ) {

      // Detach all channels if no `channelName` is passed
      if ( !channelName ) {
        _.each( this._channels, function(channel) {
          this.detachChannel( channel.channelName, off );
        }, this);
      }

      var channel = this.channel( channelName );

      if ( !channel ) {
        return;
      }

      if ( off ) {
        this.resetChannel( channelName );
      }

      delete this._channels[ channelName ];

    },

    // Return the channel so you can emit events like
    // this.channel('global').vent('eventName')
    channel: function( name ) {
      return this._channels[ name ];
    },

    // Attach events from a hash to a channel, defaulting to local
    connectEvents: function( vents, channel ) {

      channel  = channel || 'local';
      vents = this._methodsFromHash( vents );

      _.each( vents, function(fn, ventName) {
        this.channel( channel ).vent.on( ventName, _.bind(fn, this) );
      }, this);

      return this;

    },

    // Attach commands from a hash to a channel, defaulting to local
    connectCommands: function( commandsHash, channel ) {

      channel = channel || 'local';
      commandsHash = this._methodsFromHash( commandsHash );

      _.each( commandsHash, function(fn, commandName) {
        this.channel( channel ).commands.setHandler( commandName, _.bind(fn, this) );
      }, this);

      return this;

    },

    connectRequests: function( requestsHash, channel ) {

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

      this.connectEvents( ventHash, channelName )
          .connectCommands( commandsHash, channelName )
          .connectRequests( requestsHash, channelName );

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

    }

  };

  return Backbone.WreqrChannel;

}));
(function() {

  var application = {

    _puppets: {},

    puppets: function( name, puppet, options ) {

      var module;

      // Get the puppet if it exists
      if ( this._hasPuppet(name) ) {
        module = this._getPuppet( name );
      }
      // Otherwise add a new one
      else if ( puppet && puppet.prototype._isPuppet ) {
        module = new puppet( name, this, options );
        this._puppets[name] = module;
      }

      return module;
    },

    _hasPuppet: function( name ) {
      return _.has( this._puppets, name );
    },

    _getPuppet: function( name ) {
      return this._puppets[name];
    }

  }

  Marionette.Application.prototype = _.extend( Marionette.Application.prototype, application );

})();


// The base controller from which all puppets extend
// This ties all of the pieces of the puppet together, and communicates with the outside world
// via the application's wreqr

(function() {

  var Region = Marionette.Region.extend({

    _defaultDuration: 500,
    _defaultTransition: 'pop',

    constructor: function( options ){

      // Call the parent's constructor function
      Marionette.Region.prototype.constructor.apply(this, Array.prototype.slice(arguments));

    },

    _trigger: function( type ) {
      this.vent.trigger( 'region:'+type );
    },

    open: function(view){

      // Make sure the events are attached to the view
      view.delegateEvents();
      if ( this.transition === 'fade' ) {
        this.slide( this.$el, 'in', view );
      } else if ( this.transition === 'slide' ) {
        this.fade( this.$el, 'in', view );
      } else {
        this.pop( this.$el, 'in', view );
      }
      
    },

    closeView: function( view ) {
      if (view.close) { view.close(); }
      else if (view.remove) { view.remove(); }
      this._trigger( 'close' );
      Marionette.triggerMethod.call(this, "close");
      delete this.currentView;
    },

    slide: function( $el, type, view ) {

      var self = this;

      if ( type === 'in' ) {
        self._trigger( 'open' );
        $el.hide();
        $el.html( view.el );
        $el.slideDown( self.duration, function() {
          self._trigger( 'ready' );
        });
      }
      else {
        self._trigger( 'closing' );
        $el.slideUp( self.duration, function() {
          _.bind(self.closeView, self, view)();
        });
      }
      
    },

    fade: function( $el, type, view ) {

      var self = this;
      if ( type === 'in' ) {
        $el.hide();
        $el.html( view.el );
        var self = this;
        self._trigger( 'open' );
        $el.fadeIn( self.duration, function() {
          self._trigger( 'ready' );
        });
      } else {
        self._trigger( 'closing' );
        $el.fadeOut( self.duration, function() {
          _.bind(self.closeView, self, view)();
        });

      }

    },

    pop: function( $el, type, view ) {

      if ( type === 'in' ) {
        this._trigger( 'open' );
        $el.empty().append(view.el);
        this._trigger( 'ready' );
      }
      else {
        this._trigger( 'closing' );
        $el.empty();
        _.bind(this.closeView, this, view)();
      }

    },

    // Slide the element up before removing the `view`
    close: function( vent ) {
      var view = this.currentView;
      var self = this;
      if (!view || view.isClosed){ return; }

      if ( this.transition === 'fade' ) {
        this.slide( this.$el, 'out', view );
      } else if ( this.transition === 'slide' ) {
        this.fade( this.$el, 'out', view );
      } else {
        this.pop( this.$el, 'out', view );
      }
      
    } 

  });

  window.Puppets = window.Puppets || {};
  window.Puppets.Region = Region;

})();
// The base controller from which all puppets extend
// This ties all of the pieces of the puppet together, and communicates with the outside world
// via the application's wreqr

(function() {

  var ItemView = Marionette.ItemView.extend({

    modelEvents: {
      'change': 'update'
    },

    constructor: function() {

      this._rendered = false;
      Marionette.View.prototype.constructor.apply( this, Array.prototype.slice.apply(arguments) );

    },

    render: function(){
      this.isClosed = false;

      this.triggerMethod("before:render", this);
      this.triggerMethod("item:before:render", this);

      var data = this.serializeData();
      data = this.mixinTemplateHelpers(data);

      var template = this.getTemplate();
      var html = Marionette.Renderer.render(template, data);

      this.$el.html(html);
      this.bindUIElements();

      this.triggerMethod("render", this);
      this.triggerMethod("item:rendered", this);

      return this;
    },

    updateDOM: function() {

      var newPromise = $.Deferred();
      this.updatePromises.push( newPromise );
      newPromise.resolve();

    },

    update: function() {

      if ( !this._isRendered ) {
        return;
      }

      this._shareUpdating();
      this.updatePromises = [];
      this.updateDOM.apply(this, Array.prototype.slice.apply(arguments));
      $.when.apply( $, this.updatePromises ).then(_.bind(this._shareUpdate, this));

    },

    _shareUpdating: function() {
      this.vent.trigger( 'view:updating' );
    },

    _shareUpdate: function() {
      this.vent.trigger( 'view:update' );
    }

  });

  window.Puppets = window.Puppets || {};
  window.Puppets.ItemView = ItemView;

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

window.Puppets.Puppet = Marionette.Controller.extend({

  // Used by the puppet shim to determine if it's really a puppet instance
  _isPuppet: true,

  constructor: function( name, app, options ){

    this.puppetName = name;
    this.app = app;

    options = options || {};

    // Create the local and global channel, then configure them
    var localChannel  = this.attachChannel();
    var globalChannel = this.attachChannel( 'global', this.app.vent, this.app.commands, this.app.reqres );

    // this._setLocalWreqr();
    this._setDefaultState();
    this._configRegion( options );

    Marionette.Controller.prototype.constructor.apply(this, Array.prototype.slice(arguments));

    // Configure the local and global channels after the user is
    // given the opportunity to add events in `initialize()`
    this._configChannel( localChannel );
    this._configChannel( globalChannel );

    // After the user's initialize function has run, set up the components
    this._components = {};
    this._linkComponents();
    this.configureComponents( options );

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

_.extend( window.Puppets.Puppet.prototype, Backbone.WreqrChannel );


/*
 * 
 * Set up the states for the puppet & the stateful API
 *
 */

 _.extend( window.Puppets.Puppet.prototype, {

  _states: {
    _stoppedState: {
      started: false,
      ready: false,
      stopped: true,
      stopping: false
    },

    _stoppingState: {
      started: true,
      ready: false,
      stopping: true,
      stopped: false
    },

    _readyState: {
      started: true,
      ready: true,
      stopping: false,
      stopped: false
    },

    _startedState: {
      started: true,
      ready: false,
      stopping: false,
      stopped: false
    }
  },

  defaultState: 'stopped',

  _setDefaultState: function() {
    this._changeState( this.defaultState );
  },

  _changeState: function( state ) {
    var newState = this._states[ '_' + state + 'State' ];
    _.extend(this, newState);
  },

  _isStarted: function() {
    return this.started;
  },
  _isStopped: function() {
    return this.stopped;
  },
  _isReady: function() {
    return this.ready;
  },
  _isStopping: function() {
    return this.stopping;
  }

 });