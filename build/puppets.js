/*
 * Backbone.WreqrChannel
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
    root.Backbone = root._.extend( root.Backbone, factory(root, {}, root._, root.Backbone) );
  } 

}(this, function(root, WreqrChannel, _, Backbone) {

  'use strict';

  var WreqrExtension = {};

  // The channel object. All that it does is hold an instance of each messaging system
  WreqrExtension.WreqrChannel = function( name, vent, commands, reqres ) {

    // Channels need a name
    if ( !name ) {
      return;
    }

    var
    createNew = false,
    w = Backbone.Wreqr;

    // Instantiate new messaging systems if all 3 aren't passed,
    // or if they aren't instances of the messaging systems.
    if ( !vent || !commands || !reqres  ) {
      createNew = true;
    } else if ( !(vent instanceof w.EventAggregator) ) {
      createNew = true;
    } else if ( !(commands instanceof w.Commands) ) {
      createNew = true;
    } else if ( !(reqres instanceof w.RequestResponse) ) {
      createNew = true;
    }

    if ( createNew ) {
      vent = new w.EventAggregator();
      reqres = new w.RequestResponse();
      commands = new w.Commands();
    }

    this.vent     = vent;
    this.reqres   = reqres;
    this.commands = commands;
    this.channelName = name;

  };

  _.extend( WreqrExtension.WreqrChannel.prototype, {

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
      hash = this._methodsFromHash( hash );
      var method = ( type === 'vent' ) ? 'on' : 'setHandler';
      _.each( hash, function(fn, name) {
        this[type][method]( name, _.bind(fn, this) );
      }, this);

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

      var newHash = {}, method;
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

  });

  WreqrExtension.WreqrStation = {

    // Attach a channel to this station
    attachChannel: function( channel ) {

      if ( !channel || !(channel instanceof Backbone.WreqrChannel) ) {
        return;
      }

      // Ensure the channels container
      this._channels = this._channels || [];

      if ( !_.contains(this._channels, channel) ) {
        this._channels.push( channel );
      }

      return channel;

    },

    // Safely remove a channel. Pass `true` to
    // remove all listeners from the channel
    detachChannel: function( channelName, off ) {

      // There are no channels set up; ignore the request
      if ( !this._channels || !channelName ) {
        return;
      }

      // Get the channel by name
      var channel = this.channel( channelName );

      if ( !channel ) {
        return;
      }

      // Reset the channel if `off` is passed as true
      if ( off === true ) {
        channel.reset();
      }

      // Remove the channel, then return it
      this._channels = _.without( this._channels, channel );

      return channel;

    },

    detachAllChannels: function( off ) {

      if ( !this._channels ) {
        return;
      }
      var channelName;
      _.each( this._channels, function(channel) {
        channelName = channel.channelName;
        this.detachChannel( channelName, off );
      }, this);

    },

    // Return a channel by name
    channel: function( channelName ) {
      if ( !this._channels ) {
        return;
      }
      return _.findWhere( this._channels, { channelName: channelName } );
    },

    // Determine if you have a channel by the passed-in name
    hasChannel: function( channelName ) {

      if ( !this._channels ) {
        return;
      }
      var length = _.findWhere( this._channels, { channelName: channelName } );

      return length ? true : false;
    }

  };

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
        "pasta": function() {
          console.log('Stopped is handling this pasta');
        }
      },
      started: {
        _onEnter: function() {
          console.log('Started');
        },
        "truck": function() {
          console.log('Started is handling this truck');
        }
      }
    }
  });

  window.Puppets = window.Puppets || {};
  window.Puppets.Fsm = Fsm;

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

