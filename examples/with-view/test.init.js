(function() {

  window.app = new Marionette.Application({});

  app.addInitializer(function() {

    app.module("One-shouldnt", {
      moduleClass: Puppets.Puppet,
      startWithParent: true,
      define: function(Mod){
        Mod.addInitializer(function() {
          console.log("One-shouldnt started");
        });
      }
    });

  });

  app.start();

})();