(function() {

  window.Puppets.ExamplePuppet = window.Puppets.Puppet.extend({

    initialize: function( name, app, options ) {

      // The different components of the puppet
      this.components = {
        'something': SomeItemView,
        'controller': SomeController
      };

      this.states = [
        "stateOne",
        "stateTwo",
        "stateThree",
        "stateFour"
      ];

      // Call this method => From state
      this.methodsMap = {

        "actionOne"  : [ "stateOne", "stateTwo" ],
        "actionTwo"  : "*",
        "actionThree": "stateOne"

      };

      // Transition To => From state
      this.transitionsMap = {

        "stateOne" : [ "stateTwo", "stateThree" ],
        "stateTwo" : "stateOne"

      }

    },
  });

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

})();