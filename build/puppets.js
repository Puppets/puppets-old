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

  // Used by the application shim to know 
  _isPuppet: true,

  constructor: function( name, app, options ){

    this.puppetName = name;
    this.app = app;

    options = options || {};

    this._setLocalWreqr();
    this._setDefaultState();
    this._configRegion( options );

    Marionette.Controller.prototype.constructor.apply(this, Array.prototype.slice(arguments));
    this._configEvents( options );

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

  // Get / set components
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

  // Gives the component the local vent and access to the components
  _linkComponents: function() {

    if (!this.components) {
      return;
    }
    _.each(this.components, function(component, name) {

      // Give them names and access to the local wreqr channel
      component.componentName = name;
      component.puppetName = this.puppetName;
      component.localVent = this.localVent;
      component.localCommands = this.localCommands;
      component.localReqres = this.localReqres;
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
  show: function() {
    if ( this.region && this.itemView ) {
      this.region.show( this.itemView );
    }
  },

  // Close the region, if it exists
  close: function() {
    if ( this.region ) {
      this.region.close();
    }
  }

});


/*
 *
 * This file configures the local & global wreqr channels
 * for this puppet, with defaults
 *
 */

 _.extend( window.Puppets.Puppet.prototype, {

  // A mapping of the default local and global events for this puppet
  // Overwrite them via window.Puppets.Puppet.prototype.[name]
  _defaultLocalEvents: {
    'open:region': '_startedPuppet',
    'ready:region': '_readyPuppet',
    'closing:region': '_stoppingPuppet',
    'close:region': '_stoppedPuppet' 
  },
  _defaultLocalRequests: {},
  _defaultLocalCommands: {},

  _defaultGlobalCommands: {
    'start' : 'start',
    'stop': 'stop'
  },
  _defaultGlobalRequests: {
    'isStarted' : '_isStarted',
    'isReady'   : '_isReady',
    'isStopping': '_isStopping',
    'isStopped' : '_isStopped'
  },
  _defaultGlobalEvents: {},

  // Processes the defaults above
  _getDefaultNames: function( defaults ) {
    var defaultNames = {};
    var eventSuffix = ':puppets.'+this.puppetName;
    _.each( defaults, function(fnName, eventName) {

      eventName = eventName+eventSuffix;
      defaultNames[eventName] = fnName;

    }, this);
    return defaultNames;
  },

  _configEvents: function( options ) {

    this._configLocalWreqr();
    this._configGlobalWreqr( options );

  },

  _setLocalWreqr: function() {

    this.localVent = new Backbone.Wreqr.EventAggregator();
    this.localCommands = new Backbone.Wreqr.Commands();
    this.localReqres = new Backbone.Wreqr.RequestResponse();

  },

  // Set up the local communication channel
  _configLocalWreqr: function() {

    var defaultEvents = _.extend( this._defaultLocalEvents, this.localEventsHash );
    defaultEvents = this._methodsFromHash( defaultEvents );

    var defaultRequests = _.extend( this._defaultLocalRequests, this.localRequestsHash );
    defaultRequests = this._methodsFromHash( defaultRequests );

    var defaultCommands = _.extend( this._defaultLocalCommands, this.localCommandsHash );
    defaultCommands = this._methodsFromHash( defaultCommands );

    _.each( defaultEvents, function( fn, eventName ) {
      this.localVent.on( eventName, _.bind(fn, this) );
    }, this);
    _.each( defaultCommands, function( fn, eventName ) {
      this.localCommands.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( defaultRequests, function( fn, eventName ) {
      this.localReqres.setHandler( eventName, _.bind(fn, this) );
    }, this);

  },

  // Set up the global wreqr object
  _configGlobalWreqr: function( options ) {

    var defaultCommands = this._getDefaultNames( this._defaultGlobalCommands );
    var defaultRequests = this._getDefaultNames( this._defaultGlobalRequests );
    var defaultEvents   = this._getDefaultNames( this._defaultGlobalEvents );

    var globalCommands = _.extend( {}, defaultCommands, options.commands );
    var globalRequests = _.extend( {}, defaultRequests, options.requests );
    var globalEvents   = _.extend( {}, defaultEvents,  options.events );

    var commandsFns = this._methodsFromHash( globalCommands );
    var requestsFns = this._methodsFromHash( globalRequests );
    var eventsFns   = this._methodsFromHash( globalEvents );

    _.each( commandsFns, function( fn, eventName ) {
      this.app.commands.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( requestsFns, function( fn, eventName ) {
      this.app.reqres.setHandler( eventName, _.bind(fn, this) );
    }, this);
    _.each( eventsFns, function( fn, eventName ) {
      this.app.vent.on( eventName, _.bind(fn, this) );
    }, this);

  },

  // Take in a hash of eventName:functionName, and return a hash of
  // eventName:actualFunction
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

  // Adds the :puppets.[puppetName] suffix to an event type
  _suffixEventName: function( eventType ) {
    return eventType + ':puppets.'+this.puppetName;
  },

  // Share an event globally
  emitGlobalEvent: function( eventName ) {

    arguments[0] = this._suffixEventName( eventName );
    this.app.vent.trigger.apply( this.app.vent, Array.prototype.slice.apply(arguments) );

  }

});


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