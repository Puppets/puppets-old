# Puppets

An (experimental) opinionated pattern for building modular components for Marionette.js. Note: The API is subject to major changes.

## About

Marionette provides the necessary elements to build decoupled, modular applications. But one of its virtues –
its (relative) lack of opinion – can also be a flaw. It is tempting, and sometimes easy, to write tightly coupled
Marionette applications.

Puppets is an opinionated way to build components with Marionette to solve two issues: making them decoupled,
and making them reusable.

### Principles

1. Components (Puppets) should be constructed of one or more pieces that work together to accomplish a *single* task
2. Puppets should expose an API for interactions through a messaging protocol
3. Messaging in your application should be *explicitly* namespaced
4. Puppets should be reusable, plug-and-play pieces of functionality
5. Puppets should be customizable by passing in options

## Getting Started

Get the source by [direct download](https://github.com/Puppets/puppets/blob/master/build/puppets.js), cloning this repo, or Bower.

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

Note that the global `vent` is not the same `vent` that comes with a new `Marionette.Application`. They are two different things. It is recommended that
you overwrite `myApp.vent` when using Puppets.

```js
myApp = new Marionette.Application();

// I recommend overwriting vent and attaching the global commands and reqres to your Application
var globalCh = Backbone.radio.channel( 'global' );
myApp.vent = globalCh.vent;
myApp.commands = globalCh.commands;
myApp.reqres = globalCh.reqres;
```

## Puppet.prototype

The Puppets prototype is accessible via `window.Puppets.Puppet`. It's an extension of `Marionette.Module`, so it can be attached to your
application just like any other module. Simply pass it as the `moduleClass` of the module that you're instantiating.

```js
// Instantiate a Puppet by adding a module that extends from the Puppets.Puppet prototype
app.module( 'myFirstPuppet', Puppets.Puppet );
```

All Puppets, by default, have `startWithParent` set to false.

You are encouraged to extend the base class to build your own puppets.

```js
var CustomPuppet = Puppets.Puppet.extend({
  // Custom methods and properties
});
```

### Options

Puppets can be passed in options when they're instantiated.

```js
app.module( 'myPuppet', {
  // Options
});
```

The `defaults` hash of a puppet can be used to both specify which options should be kept and what their default values should be.

```js
// Pass in `someProperty` or `anotherProperty` to have them automatically be attached to this Puppet
var PuppetClass = Puppets.Puppet.extend({
  defaults: {
    someProperty: true,
    anotherProperty: 'defaultValue'
  }
});
```

You can access these options with the `option` method.

```js
// Get the value of the someProperty option
app.module( 'myPuppet' ).option( 'someProperty' );
```

### Puppets Local Channel

Every Puppet has its own local channel, which is automatically set up when you instantiate it. The name of the channel is  `puppet.{puppetName}`.

```js
app.module( 'somePuppet', Puppets.Puppet );

// Get a handle of that puppet's channel
var somePuppetCh = Backbone.radio.channel( 'puppet.somePuppet' );
```

The three protocols of a Puppet's local channel are attached directly to it.

```js
app.module( 'somePuppet', Puppets.Puppet );
var myPuppet = app.module( 'somePuppet' );

// The puppet's local channel is directly available on the puppet
myPuppet.vent;
myPuppet.commands;
myPuppet.reqres;
```

### Communicating on the global channel

There is a convenience function available for communicating on the global channel, `emit`.
This appends the name of whatever event you trigger with `:{puppetName}`.

```js
app.module( 'somePuppet', Puppets.Puppet );
var myPuppet = app.module( 'somePuppet' );

// Triggers 'anEvent:somePuppet' on the global vent
myPuppet.emit( 'anEvent' );
```

I mentioned the following fact above, but do note that the global `vent` *is not* the same `vent` that comes with Marionette Applications. It is the vent
from `Backbone.radio.channel( 'global' )`, which is another thing entirely.

### Attaching event handlers

Pass a `localEvents` or `globalEvents` hash to quickly attach handlers to events on the respective channel.

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

Specify the Classes of your pieces – not instances – with the pieces hash:

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
app.module( 'myPuppet' ).piece( 'somePiece' );
```

You can dynamically add pieces with the same method. Simply pass an already-instantiated object as the second argument.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
});

var somePiece = new Backbone.Collection();

// Set a new piece
app.module( 'myPuppet' ).piece( 'somePiece', somePiece );
```

You cannot overwrite a piece that already exists. Attempts to do so will be ignored, and the function will return `false`.

```js
app.module( 'myPuppet', Puppets.Puppet );

var somePiece = new Backbone.Collection();
var anotherPiece = new Marionette.ItemView();

// Set the piece...
app.module( 'myPuppet' ).piece( 'somePiece', somePiece );

// Returns false. This piece has already been set.
app.module( 'myPuppet' ).piece( 'somePiece', anotherPiece );
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

var piece = app.module( 'myPuppet' ).piece( 'somePiece' );

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

#### Configuring Events on the Global Channel

There is no easy way for pieces to communicate globally, as they aren't meant to. Messages that need to
'bubble' up to the global channel should first pass through the main Puppet, which then share the event through `emit`.

### Event Forwarding

All events emitted by any piece are automatically forwarded to the local channel with the `:{elementName}` suffix.

```js
app.module( 'myPuppet', {
  moduleClass: Puppets.Puppet,
  pieces: {
    somePiece: Marionette.ItemView,
  }
});

var piece = app.module( 'myPuppet' ).piece( 'somePiece' );

// This will automatically forward the render events to the local channel as:
// before:render:somePiece
// render:somePiece
piece.render();
```

## Shutting down a Puppet

Stopping a Puppet calls `reset` on its local channel. This removes all of the listeners from the channel.

For each of its pieces, it will call 'off' if it can be found. Lastly it calls `close` or `remove` on its pieces, depending on which is found.
