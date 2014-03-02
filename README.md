# Puppets

An opinionated pattern for building modular components for Marionette.js

## About

Marionette provides the necessary building blocks to build decoupled, modular application. But one of its virtues –
its (relative) lack of opinion – can be one of its flaws. It is tempting, sometimes even easy, to write tightly coupled
Marionette applications.

Puppets is an opinionated way to build components with Marionette to solve two issues: making them decoupled,
and making them reusable.

### Principles

1. Components (Puppets) should be constructed of one or more pieces that work together to accomplish a *single* task
2. Puppets should provide an API to interact with through a messaging system
3. Messaging in your application should be *explicitly* namespaced
4. Puppets should be reusable, plug-and-play pieces of functionality

## Getting Started

Get the source by [direct download](https://github.com/Puppets/puppets/blob/master/build/puppets.js), cloning this repo, or bower.

`bower install puppets`

Include the source in your site's Javascript bundle. Be sure to load it after Marionette.

## Wreqr Radio

The communication system of `Puppets` should be familiar to anyone who has used Marionette: it's just `Wreqr`. What this means is that
you'll be able to use the Event Aggregator, Commands, and Request/Response protocols that you may already be used to. There is one difference, though.
Puppets uses the [Wreqr Radio library](https://github.com/Puppets/backbone.wreqr-radio), which allows you to explicitly namespace instances of Wreqr into groups called Channels.

Sound complicated? It's really not. Take a look at how it works:

```js
// Get an instance of the global channel
var globalCh = Backbone.radio.channel( 'global' );

// Get an instance of some other channel. It is created for you if it doesn't exist
var someNewCh = Backbone.radio.channel( 'lalala' );

// Fire an event on someNewCh's vent
someNewCh.vent.trigger( 'someEvent' );
```

## Puppet.prototype

The Puppets prototype is attached to `window.Puppets.Puppet`. It's an extension of Marionette.Module, so it can be attached to your
application just like any other module.

```js
// Instantiate your first puppet by adding a module that is a puppet
app.module( 'myFirstPuppet', Puppets.Puppet );
```

Puppets, by default, have `startWithParent` set to false.

You are encouraged to extend the base class to build your own puppets.

```js
var CustomPuppet = Puppets.Puppet.extend({
  // Custom methods and properties
});
```

### Puppets Local Channel

Every Puppet has its own local channel, which is automatically set up when you instantiate it. The name of the channel is  `puppets.{puppetName}`.

```js
app.module( 'somePuppet', Puppets.Puppet );

// Get a handle of that puppet's channel
var somePuppetCh = Backbone.radio.channel( 'puppets.somePuppet' );
```

Within the puppet you can access the three protocols of its local channel directly.

```js
app.module( 'somePuppet', Puppets.Puppet );
var myPuppet = app.module( 'somePuppet' );

// The puppet's local channel is directly available on the puppet
myPuppet.vent;
myPuppet.commands;
myPuppet.reqres;
```

### Communicating on the global channel

Communicating on the global channel is easy, too. Simply use the `emit` helper function. This appends whatever event you trigger with `:{puppetName}`.

```js
app.module( 'somePuppet', Puppets.Puppet );
var myPuppet = app.module( 'somePuppet' );

// Triggers 'anEvent:somePuppet' on the global vent
myPuppet.emit( 'anEvent' );
```

Take note that the global vent does not equal the instance of `vent` that is attached to Marionette Applications by default. It is the vent
from `Backbone.radio.channel( 'global' )`, which is another thing entirely.

### Attaching event handlers

Puppets comes with a convenient way to attach handlers to events. Simply pass a `localEvents` or `globalEvents` hash, depending on the channel
you wish to associate the handler with.

```js
var PuppetClass = Puppets.Puppet.extend({
  localEvents: {
    vent: {
      someEvent: someCb,
      someOtherEvent: someOtherCb
    },
    commands: {
      someCommand: someHandler
    },
    reqres: {
      someReqest: function() {}
    }
  },
  // Configure the global responses, too
  globalEvents: {}
});
```

Each hash is passed through Marionette's normalizeMethods function. What this means is that you can provide strings that will be converted into references
to functions of the same name, if they exist on the Puppet.

```js
var PuppetClass = Puppets.Puppet.extend({
  localEvents: {
    vent: {
      someEvent: 'myMethod',
  },
  // This is called when someEvent is triggered
  myMethod: function() {}
});
```

## Puppet Pieces

Puppets can have Pieces. These are simply instances of any other object that are attached directly to the Puppet, and connected through its local channel.

Specify your pieces with the pieces hash:

```js
var PuppetClass = Puppets.Puppet.extend({
  pieces: {
    somePiece: Marionette.ItemView,
    anotherPiece: Marionette.Controller
    modelPiece: Backbone.Model
  }
});
```

Pieces are instantiated alongside the puppet itself.

### Getting and Setting Pieces

Once a piece has been created, you can access it with the `pieces` method.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
  pieces: {
    somePiece: Marionette.ItemView,
  }
});

// Get the newly-created instance of Marionette.ItemView
app.module( 'myPuppet' ).pieces( 'somePiece' );
```

You can dynamically add pieces with the same method. Simply pass an already-instantiated object as the second argument.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
});

var somePiece = new Backbone.Collection();

// Set a new piece
app.module( 'myPuppet' ).pieces( 'somePiece', somePiece );
```

You cannot overwrite a piece that already exists. Attempts to do so will be ignored, and a value of `false` will be
returned from the function

```js
app.module( 'myPuppet', Puppets.Puppet);

var somePiece = new Backbone.Collection();
var anotherPiece = new Marionette.ItemView();

// Set the piece...
app.module( 'myPuppet' ).pieces( 'somePiece', somePiece );

// Returns false. This piece has already been set.
app.module( 'myPuppet' ).pieces( 'somePiece', anotherPiece );
```

### Options passed to pieces

The options sent to the `constructor` and `initialize` functions of the pieces are the same options passed as the Puppet definition.
This allows you to quickly pass data down from the module initializer to its individual pieces.

```js
// Set up our piece
var MyPiece = Puppet.ItemView.extend({
  initialize: function( options ) {
    this.color = options.color;
  }
});

app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
  pieces: {
    myPiece: MyPiece
  },
  color: '#434343'
});

// '#434343'
app.module( 'myPuppet' ).piece( 'myPiece' ).color;
```

### Pieces Local Channel

Pieces are given direct access to the local channel, just like its parent Puppet.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
  pieces: {
    somePiece: Marionette.ItemView,
  }
});

var piece = app.module( 'myPuppet' ).pieces( 'somePiece' );

// The local channel messaging protocols
piece.vent;
piece.commands;
piece.reqres;
```

#### Configuring Events on the Local Channel

Just like its parent Puppet, pieces can set a `localEvents` hash.

```js
var CustomItemView = Marionette.CompositeView.extend({
  localEvents: {
    anEvent: 'myCallback'
  }
});
```

### Configuring Events on the Global Channel

There is no easy way for pieces to communicate globally, as they aren't supposed to. Messages that need to
'bubble' up in that way should first pass through the main Puppet, which then forwards the event through `emit`.

### Event Forwarding

All events emitted by any piece are automatically forwarded to the local channel with the `:{elementName}` suffix.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
  pieces: {
    somePiece: Marionette.ItemView,
  }
});

var piece = app.module( 'myPuppet' ).pieces( 'somePiece' );

// This will automatically forward the render events to the local channel as:
// before:render:somePiece
// render:somePiece
piece.render();
```