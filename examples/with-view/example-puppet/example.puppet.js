(function() {

  var SomeController = Marionette.Controller.extend({

    actionOne: function() {

      console.log( 'ACTION ONE!' );

    },

    actionTwo: function() {

      console.log( 'ACTION TWO!' );

    }

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

  window.Puppets.ExamplePuppet = window.Puppets.Puppet.extend({

    components: {
      'something': SomeItemView,
      'controller': SomeController
    },

    statesMap: {
      stateOne: [ 'stateThree', 'actionTwo' ],
      stateTwo: 'stateOne',
      stateThree: 'stateOne',
      stateFour: null
    }

  });

  

})();