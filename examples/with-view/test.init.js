(function() {

  window.app = new Marionette.Application({});

  app.addInitializer(function() {

    app.module("Test", {
      moduleClass: Puppets.ExamplePuppet,
      actions: {
        stateOne: 'event:state',
        actionOne: 'event:one',
        actionTwo: '*',
        actionThree: 'event:three',
        actionFour: 'event:four',
      }
    });

  });

  app.start();

})();