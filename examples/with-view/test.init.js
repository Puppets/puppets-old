(function() {

  window.app = new Marionette.Application({});

  app.addInitializer(function() {

    app.module("Test", {
      moduleClass: Puppets.ExamplePuppet,
      startWithParent: true,
      events: {
        "event:one": {
          type: 'method',
          methodName: 'actionOne'
        },
        "event:two": {
          type: 'transition',
          newState: 'stateOne'
        },
        "event:three": "actionThree",
        "event:four": "actionFour"
      }
    });

  });

  app.start();

})();