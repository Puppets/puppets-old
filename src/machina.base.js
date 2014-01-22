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