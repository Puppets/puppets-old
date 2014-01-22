/*
 *
 * Stateful
 * Gives an object four state variables
 *
 */

 window.Stateful = {

  _currentState: {},

  _defaultState: 'stopped',

  _states: {
    stopped: {
      started:  false,
      ready:    false,
      stopped:  true,
      stopping: false
    },

    stopping: {
      started:  true,
      ready:    false,
      stopping: true,
      stopped:  false
    },

    ready: {
      started:  true,
      ready:    true,
      stopping: false,
      stopped:  false
    },

    started: {
      started:  true,
      ready:    false,
      stopping: false,
      stopped:  false
    }
  },

  setDefaultState: function() {
    this._changeState( this.defaultState );
  },

  changeState: function( state ) {
    var newState = this._states[ state ];
    this._currentState = newState;
  },

  isStarted: function() {
    return this._currentState.started;
  },
  isStopped: function() {
    return this._currentState.stopped;
  },
  isReady: function() {
    return this._currentState.ready;
  },
  isStopping: function() {
    return this._currentState.stopping;
  }

 });