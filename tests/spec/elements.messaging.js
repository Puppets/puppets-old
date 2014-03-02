describe( 'Events emitted by elements', function() {

  var CustomView, PuppetClass, puppet, localCh, spy;

  beforeEach(function() {

    PuppetClass = Puppets.Puppet.extend({
      elements: {
        someElement: Marionette.Controller,
      }
    });
    puppet = new PuppetClass( 'puppetName', {}, {} );
    spy = sinon.spy( puppet.channels.local.vent, 'trigger' );
    puppet.element( 'someElement' ).close();

  });

  it( 'should be forwarded to the local channel and suffixed', function() {
    expect( spy ).to.have.been.calledOnce;
    expect( spy ).to.have.been.calledWithExactly( 'close:someElement' );
  });

});