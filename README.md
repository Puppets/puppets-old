# Puppets

A modular framework for Marionette.js

### Start a Channel

`startChannel( channelName )`

When you attach a new Channel you may wish to attach a number of events to each messaging system. This convenience function does a lot of the set up work for you. First, it merges events from `_defaultEvents[ channelName ]` and `channelsHashes[ channelName ]` objects, if they exist. It then attaches the listeners to the appropriate messaging system on the channel.

Typically if you make a new class that you wish people to extend from you would set `_defaultEvents` on that class. Then in the `initialize` function the user would have the opportunity to overwrite those defaults in `channelsHashes`.