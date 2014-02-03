(function() {

  window.Puppets.ExamplePuppet = window.Puppets.Puppet.extend({


    define: function() {

      console.log('2');

    },

    initialize: function( name, app, options ) {

      this.components = {
        'something': SomeItemView
      };

      this.events = {

        local: {
          'lala': this.someFn
        },
        global: {
          'lala': this.controller
        },
        'fsm.events': {
          'lala': this.someFn
        }

      };

    },
  });

  var SomeItemView = Marionette.ItemView.extend({

    // Initialized with the same options as the Puppet
    initialize: function( options ) {

      // Configure some events here for magical-ness
      this.events = {
        'lalala:wut': this.testFn
      };

      this.states = {

      }

    }

  });

})();