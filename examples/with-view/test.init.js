(function() {

  window.app = new Marionette.Application({});

  app.start();

  app.addInitializer(function() {

    app.module("TestPuppet", {
      moduleClass: Puppets.Puppet,
      initialize: function( option ) {
        
      }
    });

  });

})();