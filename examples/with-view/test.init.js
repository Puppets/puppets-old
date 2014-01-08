// This is an example script on how to initialize the puppet in your application

(function() {

  // Start a new Marionette application
  app = new Backbone.Marionette.Application();
  app.start();

  // Set up a model for this
  app.addInitializer( function() {

    var modelData = {
      awayCity: 'Denver',
      awayTeam: 'Broncos',
      homeCity: 'Baltimore',
      homeTeam: 'Ravens',
      clockTime: '7:10',
      meridiem: 'AM',
      timeZone: 'ET',
      status: 'on time'
    };

    this.testModel = new Backbone.Model(modelData);

  });

  // Add an initializer that loads the module
  app.addInitializer( function() {

    // this.vent.on( 'scheduleInfo:open', function() {
    //   console.log( 'The open is successful' );
    // });
    // this.vent.on( 'scheduleInfo:ready', function() {
    //   console.log( 'The ready is successful' );
    // });
    // this.vent.on( 'hello:closing', function() {
    //   console.log( 'The closing is successful' );
    // });
    // this.vent.on( 'hello:close', function() {
    //   console.log( 'The closed is successful' );
    // });
    // this.vent.on( 'hello:updating', function() {
    //   console.log( 'The updating is successful' );
    // });
    // this.vent.on( 'hello:update', function() {
    //   console.log( 'The update is successful' );
    // });
    var testRegion = Puppets.Region.extend({
      el: '#test'
    });
    var testRegionOne = Puppets.Region.extend({
      el: '#testone'
    });
    var testRegionTwo = Puppets.Region.extend({
      el: '#testtwo'
    });
    var testRegionThree = Puppets.Region.extend({
      el: '#testthree'
    });

     // Set up the region for the pre game
    this.addRegions({
      testRegion: testRegion,
      testRegionOne: testRegionOne,
      testRegionTwo: testRegionTwo,
      testRegionThree: testRegionThree
    });

    // Configure the options for the pre game
    var preGameOptions = {
      region: this.getRegion('testRegion'),
      model: this.testModel,
      transition: 'slide',
      duration: 1000
    };
    var preGameOptionsOne = {
      region: this.getRegion('testRegionOne'),
      model: this.testModel,
      transition: 'fade',
      duration: 3000
    };
    var preGameOptionsTwo = {
      region: this.getRegion('testRegionTwo'),
      model: this.testModel
    };
    var preGameOptionsThree = {
      region: this.getRegion('testRegionThree'),
      model: this.testModel
    };

    this.puppets( 'scheduleInfo', Puppets.NflGameInfo, preGameOptions );
    this.puppets( 'preTweets', Puppets.NflGameInfo, preGameOptionsOne );
    this.puppets( 'summary', Puppets.NflGameInfo, preGameOptionsTwo );
    this.puppets( 'tester', Puppets.NflGameInfo, preGameOptionsThree );

  });

  window.app = app;

})();