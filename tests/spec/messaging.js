describe('Executing the emit method', function() {

  var puppet, channelName, eventName,
  globalCh, stub;

  beforeEach(function() {

    puppet = new Puppets.Puppet( 'puppetName', {}, {} );
    channelName = puppet.channelName;
    eventName = 'someEventName';
    globalCh = Backbone.radio.channel( 'global' );
    stub = sinon.stub( globalCh.vent, 'trigger' );

  });

  afterEach(function() {
    globalCh.vent.trigger.restore();
  });

  describe('and passing no arguments', function() {

    beforeEach(function() {

      puppet.emit( eventName, true, 200, 'sandwich' );

    });

    it( 'should forward the arguments, prefixing the event name', function() {
      expect( stub ).to.have.been.calledOnce;
      expect( stub ).to.have.been.calledWithExactly( eventName+':'+channelName, true, 200, 'sandwich' );
    });

  });

  

});