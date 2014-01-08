(function() {

  window.app = new Marionette.Application({});
  app.start();

  app.addInitializer(function() {

    this.testPuppet = new window.ExamplePuppet('ex', this );

  });

})();