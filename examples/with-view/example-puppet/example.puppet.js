(function() {

  var someItemView = new Marionette.ItemView({

    initialize: function() {

      // Configure some events here for magical-ness
      this.localEventsHash = {
        'lalala:wut': this.testFn
      };

    },

    testFn: function() {

      console.log('No wai');

    }

  });

  window.ExamplePuppet = window.Puppets.Puppet.extend({

    initialize: function( name, app, options ) {

      this.components = {
        'something': someItemView
      };

      // These hashes bind to the puppet Controller for now
      // I want to be able to specify this on the components
      // as well, but bind it to those components
      this.localEventsHash = {
        'lalala:wut': this.test
      };
      this.localCommandsHash = {
        'doitpls': this.testCommand
      };
      this.localRequestsHash = {
        'testReq': this.testReq
      };

    },

    test: function() {
      this.emitGlobalEvent('woot', 'ok', 'yes');
    },

    testReq: function() {
      return 'Succezz';
    },

    testCommand: function() {
      console.log('okok...');
    },

    configureComponents: function( options ) {

    }

  });

})();