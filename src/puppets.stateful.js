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