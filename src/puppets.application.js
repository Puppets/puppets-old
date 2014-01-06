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

