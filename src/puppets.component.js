/*
 * Puppets.Component
 * Modules are made up of components that all have access to the local vent
 * and other components
 * This applies those properties to the components
 *
 */

 (function() {

  var Component = {

    shareEvent: function( name ) {
      this.localVent.trigger( name+":"+this.componentName );
    }

  };

  window.Puppets = window.Puppets || {};
  window.Puppets.Component = Component;

 })();