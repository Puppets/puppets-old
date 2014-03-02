describe('Calling the pieces method on a puppet', function() {

  var PuppetClass, puppet, channelName, stub,
  returnedEl, overwrittenEl, attachedEl, controller;

  beforeEach(function() {

    controller = new Marionette.Controller();
    PuppetClass = Puppets.Puppet.extend({
      pieces: {
        somePiece: Marionette.ItemView
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );
    returnedEl = puppet.piece( 'somePiece' );
    overwrittenEl = puppet.piece( 'somePiece', {} );
    attachedEl = puppet.piece( 'newPiece', controller );
  });

  it( 'should return the instantiated piece', function() {
    expect( returnedEl ).to.be.instanceof( Marionette.ItemView );
  });

  it( 'should refuse to overwrite an existing el', function() {
    expect( overwrittenEl ).to.be.false;
  });

  it( 'should attach the new piece when it doesn\'t exist', function() {
    expect( attachedEl ).to.equal( controller );
  });

});


describe('Specifying an pieces hash', function() {

  var PuppetClass, puppet, channelName, stub;

  beforeEach(function() {

    PuppetClass = Puppets.Puppet.extend({
      pieces: {
        somePiece: Marionette.ItemView,
        anotherPiece: Marionette.ItemView,
        someController: Marionette.Controller
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  describe('and passing classes as the values', function() {

    var somePiece, anotherPiece, someController, puppetChannels,
    localCh,
    localCommands, localVent, localReqres,
    pieceCommands, pieceVent, pieceReqres;

    beforeEach(function() {

      somePiece = puppet._pieces.somePiece;
      anotherPiece = puppet._pieces.anotherPiece;
      someController = puppet._pieces.someController;

      puppetChannels = puppet.channels;
      localCh = puppet.channels.local;

      localCommands = localCh.commands;
      localVent = localCh.vent;
      localReqres = localCh.reqres;

      pieceCommands = somePiece.commands;
      pieceVent = somePiece.vent;
      pieceReqres = somePiece.reqres;

    });

    it( 'should instantiate those objects', function() {
      expect( somePiece ).to.be.an.instanceof( Marionette.ItemView );
      expect( anotherPiece ).to.be.an.instanceof( Marionette.ItemView );
      expect( someController ).to.be.an.instanceof( Marionette.Controller );
    });

    it( 'should attach names to the object', function() {
      expect( somePiece ).to.have.property( 'puppetName', 'puppetName' );
      expect( somePiece ).to.have.property( 'pieceName', 'somePiece' );
      expect( somePiece ).to.have.property( 'channelName', 'puppets.'+'puppetName' );
    });

    it( 'should attach the local protocols directly on the object', function() {
      expect( somePiece ).to.have.property( 'vent' );
      expect( somePiece ).to.have.property( 'commands' );
      expect( somePiece ).to.have.property( 'reqres' );
      expect( pieceCommands ).to.equal( localCommands );
      expect( pieceVent ).to.equal( localVent );
      expect( pieceReqres ).to.equal( localReqres );
    });

    it( 'should attach normalizeMethods', function() {
      expect( somePiece ).to.have.property( 'normalizeMethods' );
    });

    it( 'should attach the puppet\'s channels', function() {
      expect( somePiece ).to.have.property( 'channels', puppetChannels );
    });

  });

  describe('and calling the piece method', function() {

    var somePiece, gatheredPiece;

    beforeEach(function() {
      somePiece = puppet._pieces.somePiece;
      gatheredPiece = puppet.piece( 'somePiece' );
    });

    it( 'should return the object', function() {
      expect( somePiece ).to.equal( gatheredPiece );
    });

  });

  describe('and calling the piece method on a nonexistent piece', function() {

    var gatheredPiece;

    beforeEach(function() {
      gatheredPiece = puppet.piece( 'doesntExist' );
    });

    it( 'should return undefined', function() {
      expect( gatheredPiece ).to.be.undefined;
    });

  });

});

// This test is really bad. Can I devise a way to spy on the normalizeMethods function directly?
describe( 'Setting a local events hash on the piece', function() {

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
      pieces: {
        somePiece: CustomView,
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  it( 'should normalize the events', function() {
    expect( localEventsHash ).to.equal( existingVent );
  });

});