describe('Calling the elements method on a puppet', function() {

  var PuppetClass, puppet, channelName, stub,
  returnedEl, overwrittenEl, attachedEl, controller;

  beforeEach(function() {

    controller = new Marionette.Controller();
    PuppetClass = Puppets.Puppet.extend({
      elements: {
        someElement: Marionette.ItemView
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );
    returnedEl = puppet.element( 'someElement' );
    overwrittenEl = puppet.element( 'someElement', {} );
    attachedEl = puppet.element( 'newElement', controller );
  });

  it( 'should return the instantiated element', function() {
    expect( returnedEl ).to.be.instanceof( Marionette.ItemView );
  });

  it( 'should refuse to overwrite an existing el', function() {
    expect( overwrittenEl ).to.be.false;
  });

  it( 'should attach the new element when it doesn\'t exist', function() {
    expect( attachedEl ).to.equal( controller );
  });

});


describe('Specifying an elements hash', function() {

  var PuppetClass, puppet, channelName, stub;

  beforeEach(function() {

    PuppetClass = Puppets.Puppet.extend({
      elements: {
        someElement: Marionette.ItemView,
        anotherElement: Marionette.ItemView,
        someController: Marionette.Controller
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  describe('and passing classes as the values', function() {

    var someElement, anotherElement, someController, puppetChannels,
    localCh,
    localCommands, localVent, localReqres,
    elementCommands, elementVent, elementReqres;

    beforeEach(function() {

      someElement = puppet._elements.someElement;
      anotherElement = puppet._elements.anotherElement;
      someController = puppet._elements.someController;

      puppetChannels = puppet.channels;
      localCh = puppet.channels.local;

      localCommands = localCh.commands;
      localVent = localCh.vent;
      localReqres = localCh.reqres;

      elementCommands = someElement.commands;
      elementVent = someElement.vent;
      elementReqres = someElement.reqres;

    });

    it( 'should instantiate those objects', function() {
      expect( someElement ).to.be.an.instanceof( Marionette.ItemView );
      expect( anotherElement ).to.be.an.instanceof( Marionette.ItemView );
      expect( someController ).to.be.an.instanceof( Marionette.Controller );
    });

    it( 'should attach names to the object', function() {
      expect( someElement ).to.have.property( 'puppetName', 'puppetName' );
      expect( someElement ).to.have.property( 'elementName', 'someElement' );
      expect( someElement ).to.have.property( 'channelName', 'puppets.'+'puppetName' );
    });

    it( 'should attach the local protocols directly on the object', function() {
      expect( someElement ).to.have.property( 'vent' );
      expect( someElement ).to.have.property( 'commands' );
      expect( someElement ).to.have.property( 'reqres' );
      expect( elementCommands ).to.equal( localCommands );
      expect( elementVent ).to.equal( localVent );
      expect( elementReqres ).to.equal( localReqres );
    });

    it( 'should attach normalizeMethods', function() {
      expect( someElement ).to.have.property( 'normalizeMethods' );
    });

    it( 'should attach the puppet\'s channels', function() {
      expect( someElement ).to.have.property( 'channels', puppetChannels );
    });

  });

  describe('and calling the element method', function() {

    var someElement, gatheredElement;

    beforeEach(function() {
      someElement = puppet._elements.someElement;
      gatheredElement = puppet.element( 'someElement' );
    });

    it( 'should return the object', function() {
      expect( someElement ).to.equal( gatheredElement );
    });

  });

  describe('and calling the element method on a nonexistent element', function() {

    var gatheredElement;

    beforeEach(function() {
      gatheredElement = puppet.element( 'doesntExist' );
    });

    it( 'should return undefined', function() {
      expect( gatheredElement ).to.be.undefined;
    });

  });

});

// This test is really bad. Can I devise a way to spy on the normalizeMethods function directly?
describe( 'Setting a local events hash on the element', function() {

  var CustomView, PuppetClass, puppet, spy, localEventsHash, existingVent, nonExistingVent;

  beforeEach(function() {

    existingVent = {
      someOtherEvent: function() {}
    };
    nonExistingVent = {
      someEvent: ''
    };

    localEventsHash = _.extend(existingVent, nonExistingVent);

    CustomView = Marionette.ItemView.extend({
      localEvents: localEventsHash
    });

    PuppetClass = Puppets.Puppet.extend({
      elements: {
        someElement: CustomView,
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  it( 'should normalize the events', function() {
    expect( localEventsHash ).to.equal( existingVent );
  });

});