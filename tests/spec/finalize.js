describe('Closing a Puppet', function() {

  var PuppetClass, puppet, localCh, spy;

  beforeEach(function() {

    puppet = new Puppets.Puppet( 'puppetName', {}, {} );
    localCh = puppet.channels.local;
    spy = sinon.spy( localCh, 'reset' );
    puppet.start();
    puppet.stop();

  });

  it( 'should reset its local channel', function() {
    expect( spy ).to.have.been.calledOnce;
  });

});

describe('Closing a Puppet with pieces', function() {

  var PuppetClass, puppet, localCh, spy;

  beforeEach(function() {

    PuppetClass = Puppets.Puppet.extend({
      pieces: {
        somePiece: Marionette.ItemView,
        someController: Marionette.Controller
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );
    localCh = puppet.channels.local;
    spy = sinon.spy( localCh, 'reset' );
    puppet.start();
    puppet.stop();

  });

  it( 'should reset its local channel', function() {
    expect( spy ).to.have.been.calledOnce;
  });

});