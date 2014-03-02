describe('Instantiating a puppet', function() {

  var puppet, channelName,
  vent, commands, reqres,
  localVent, localCommands, localReqres;

  beforeEach(function() {

    puppet = new Puppets.Puppet( 'puppetName', {}, {} );
    channelName = puppet._channelName();

    reqres = puppet.reqres;
    vent = puppet.vent;
    commands = puppet.commands;

    localVent = Backbone.radio.channel( channelName ).vent;
    localCommands = Backbone.radio.channel( channelName ).commands;
    localReqres = Backbone.radio.channel( channelName ).reqres;


  });

  afterEach(function() {

    puppet.channels.local.reset();
    puppet.channels.global.reset();

  });

  it( 'should attach the local channel protocols directly to the Puppet', function() {
    expect( puppet ).to.have.property( 'vent' );
    expect( puppet ).to.have.property( 'commands' );
    expect( puppet ).to.have.property( 'reqres' );
    expect( commands ).to.equal( localCommands );
    expect( vent ).to.equal( localVent );
    expect( reqres ).to.equal( localReqres );
  });

});

describe('Specifying a local & global events hash', function() {

  var puppetClass, puppet,
  localEventsHash, globalEventsHash;

  beforeEach(function() {

    localEventsHash = {
      vent: { someEvent: function() {} },
      commands: { someCommand: function() {} },
      reqres: { someRequest: function() {} }
    };
    globalEventsHash = {
      vent: { someOtherEvent: function() {} },
      commands: { someOtherCommand: function() {} },
      reqres: { someOtherRequest: function() {} }
    };

  });

  afterEach(function() {

    puppet.channels.local.reset();
    puppet.channels.global.reset();

  });

  describe('on the object directly', function() {

    beforeEach(function() {

      PuppetClass = Puppets.Puppet.extend({
        localEvents: localEventsHash,
        globalEvents: globalEventsHash
      });

      puppet = new PuppetClass( 'puppetName', {}, {} );

    });

    it( 'should attach them both to the puppet', function() {
      puppet.localEventsHash = localEventsHash;
      puppet.globalEventsHash = globalEventsHash;
    });

  });

  describe('in the object initializer', function() {

    beforeEach(function() {

      PuppetClass = Puppets.Puppet.extend({
        initialize: function() {
          this.localEvents = localEventsHash;
          this.globalEvents = globalEventsHash;
        }
      });

      puppet = new PuppetClass( 'puppetName', {}, {} );

    });

    it( 'should attach them both to the puppet', function() {
      puppet.localEventsHash = localEventsHash;
      puppet.globalEventsHash = globalEventsHash;
    });

  });

  describe('in the object define function', function() {

    beforeEach(function() {

      PuppetClass = Puppets.Puppet.extend({
        define: function() {
          this.localEvents = localEventsHash;
          this.globalEvents = globalEventsHash;
        }
      });

      puppet = new PuppetClass( 'puppetName', {}, {} );

    });

    it( 'should attach them both to the puppet', function() {
      puppet.localEventsHash = localEventsHash;
      puppet.globalEventsHash = globalEventsHash;
    });

  });

});

describe('Configuring events hashes', function() {

  var puppetClass, puppet, localEventsHash, globalEventsHash, spy;

  beforeEach(function() {

    localEventsHash = {
      vent: { someEvent: function() {} },
      commands: { someCommand: function() {} },
      reqres: { someRequest: function() {} }
    };

    globalEventsHash = {
      vent: { someOtherEvent: function() {} },
      commands: { someOtherCommand: function() {} },
      reqres: { someOtherRequest: function() {} }
    };

    PuppetClass = Puppets.Puppet.extend({
      localEvents: _.clone(localEventsHash),
      globalEvents: _.clone(globalEventsHash)
    });

    spy = sinon.spy( PuppetClass.prototype, 'normalizeMethods' );

    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  afterEach(function() {

    PuppetClass.prototype.normalizeMethods.restore();

  });

  it( 'should normalize them', function() {
    expect( spy ).to.have.been.calledWith( localEventsHash.vent );
    expect( spy ).to.have.been.calledWith( localEventsHash.commands );
    expect( spy ).to.have.been.calledWith( localEventsHash.reqres );
    expect( spy ).to.have.been.calledWith( globalEventsHash.vent );
    expect( spy ).to.have.been.calledWith( globalEventsHash.commands );
    expect( spy ).to.have.been.calledWith( globalEventsHash.reqres );
  });

});

describe('Specifying an events hash on startup', function() {

  var puppetClass, puppet, localEventsHash, globalEventsHash,
  localVentStub, localCommandsStub, localReqresStub,
  globalVentStub, globalCommandsStub, globalReqresStub,
  localCh, globalCh, puppetName;

  beforeEach(function() {

    puppetName = 'puppetName';

    localEventsHash = {
      vent: { someEvent: function() {} },
      commands: { someCommand: function() {} },
      reqres: { someRequest: function() {} }
    };

    globalEventsHash = {
      vent: { someOtherEvent: function() {} },
      commands: { someOtherCommand: function() {} },
      reqres: { someOtherRequest: function() {} }
    };

    PuppetClass = Puppets.Puppet.extend({
      localEvents: _.clone(localEventsHash),
      globalEvents: _.clone(globalEventsHash)
    });

    localCh = Backbone.radio.channel( 'puppet.'+puppetName );
    globalCh = Backbone.radio.channel( 'global' );

    localVentStub = sinon.spy( localCh, 'connectEvents' );
    localCommandsStub = sinon.spy( localCh, 'connectCommands' );
    localReqresStub = sinon.spy( localCh, 'connectRequests' );

    globalVentStub = sinon.spy( globalCh, 'connectEvents' );
    globalCommandsStub = sinon.spy( globalCh, 'connectCommands' );
    globalReqresStub = sinon.spy( globalCh, 'connectRequests' );

    puppet = new PuppetClass( 'puppetName', {}, {} );

  });

  afterEach(function() {

    localCh.connectEvents.restore();
    localCh.connectCommands.restore();
    localCh.connectRequests.restore();

    globalCh.connectEvents.restore();
    globalCh.connectCommands.restore();
    globalCh.connectRequests.restore();

    localCh.reset();
    globalCh.reset();

  });

  it( 'should attach them to the channels', function() {
    expect( localVentStub ).to.have.been.calledWith( localEventsHash.vent );
    expect( localCommandsStub ).to.have.been.calledWith( localEventsHash.commands );
    expect( localReqresStub ).to.have.been.calledWith( localEventsHash.reqres );
    expect( globalVentStub ).to.have.been.calledWith( globalEventsHash.vent );
    expect( globalCommandsStub ).to.have.been.calledWith( globalEventsHash.commands );
    expect( globalReqresStub ).to.have.been.calledWith( globalEventsHash.reqres );
  });

});

