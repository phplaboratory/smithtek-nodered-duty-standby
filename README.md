# Node-RED SmithTek Node

This is a [Node-RED](http://nodered.org) node used to interact with the SmithTek service. It publishes and suscribes to one or multiple variables.

## Installation -- TODO UPDATE THIS WHEN PUBLISHING TO NPM

The `smithtek-nodered` node for Node-RED is available as an [npm package](https://www.npmjs.com/package/smithtek-nodered). We recommend
you to read [Node-RED documentation](https://nodered.org/docs/getting-started/adding-nodes.html#installing-npm-packaged-nodes) if you
have any doubts installing nodes in the platform.

## Usage

There are four different nodes: One for controlling the pumps, and 3 for formatting input `msg.payload` into the command format for that controller.

### Smithtek Duty/Standby Controller

This Node will control two pumps, turning on and off the pumps in a 2 to 1 ratio, with the ability to specify the primary pump. 
The controller will attempt to start a pump and if it doesn't receive a sense flow signal in the specified time out, will attempt to switch pumps.

These are the properties you should configure, by double clicking the node:

* __Flow Sense Delay__: This amount of time to wait for the flow sense signal before switching pumps.
* __Primary Pump__: Which pump is primary (will run twice and then run the secondary once)

#### Commands

There are three commands that this node takes as input.

* __startStop__: This is the command to start and stop the pump. It has the format of:
```
{
  payload: {
    cmd:"startStop",
    value: true/false or 1/0
  }
}
```

* __senseFlow__: This is the command to indicate that flow has been sensed. True indicates flow has been detected. It has the format of:
```
{
  payload:{
    cmd:"senseFlow",
    flow: true/false or 1/0
  }
}
```

* __pumpTrip__: This is the command to lock/clear a pump. True will lock the pump, False will clear the lock. It has the format of:
```
{
  payload:{
    cmd:"pumpTrip",
    value:{
      pump: 1 or 2,
      trip: true/false or 1/0
    }
  }
}
```

#### Outputs
* __pump 1__: Output to control pump 1
* __pump 2__: Output to control pump 2
* __no flow 1__: True indicates no flow detected while running pump 1
* __no flow 2__: True indicates no flow detected while running pump 2

### SmithTek startStop Formatter

This node is used to format the `msg.payload` on the input into the `startStop` command above. 
The incoming payload will become the `value` on the command.

### SmithTek senseFlow Formatter

This node is used to format the `msg.payload` on the input into the `senseFlow` command above. 
The incoming payload will become the `flow` on the command.

### SmithTek pumpTrip Formatter

This node is used to format the `msg.payload` on the input into the `pumpTrip` command above. 
The incoming payload will become the `value.trip` on the command.

These are the properties you should configure, by double clicking the node:

* __Pump Number__: Which pump is this for, it will become the `value.pump` in the output command.

## Development

If you want to modify this extension, you just have to run `npm install` or `yarn install` to fetch and install the dependencies.

To install the development version and use it on your Node-RED instance, you can execute `npm link` on this folder and then execute
`npm link smithtek-nodered` in your `~/.nodered` folder.

## License

This software is provided under the MIT license. See [LICENSE](LICENSE) for applicable terms.
