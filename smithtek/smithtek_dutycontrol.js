module.exports = function(RED){
    function DutyControlNode(config){
        RED.nodes.createNode(this,config);

        // Timeout for sensing flow. If a 0/1 false/true isn't sensed on the no-flow input for a
        //    pump in this amount of time, lock out that pump and switch to the other.
        // Values should be between 0-300 seconds
        this.flowSenseTimeout = config.senseTime * 1000;


        this.primaryPump = -1;  // error condition for primary pump, should be configured 1 or 2
        // Primary Pump - values are "Pump 1" or "Pump 2" drop down in gui
        if(config.primary === "Pump 1"){
            this.primaryPump = 1;
        } else if (config.primary === "Pump 2"){
            this.primaryPump = 2;
        }

        // control flags
        this.currentPump = this.primaryPump;  // which pump are we currently operating
        this.cycleCount = 0; // how many cycles have we run the current pump

        this.pumpOneLock = false;
        this.pumpTwoLock = false;

        this.senseTimeout = null;

        this.running = false;

        // some constants
        this.primaryCycles = 2;
        this.secondaryCycles = 1;

        this.payloadTrue = {payload: true};
        this.payloadFalse = {payload: false};
        this.outputNoFlowDetected = {payload: true};
        this.outputFlowDetected = {payload: false};

        var node = this;

        this.startStop = function(msg){
            if(msg.payload.value === 0 || msg.payload.value === false || msg.payload.value === "false"){
                // stop the pumps
                this.stopPumps();
            }  else if(msg.payload.value === 1 || msg.payload.value === true || msg.payload.value === "true") {
                this.nextCycle();
            }
        };

        this.senseFlow = function(msg){
            if(this.running) { // if we're not running, we don't care about sensing flow here.
                let outArray = Array(4).fill(null);
                if (msg.payload.flow === 1 || msg.payload.flow === true || msg.payload.flow === "true") {
                    // flow is happening, if there is a timeout waiting for it, we'll kill it
                    if (node.senseTimeout != null) {
                        clearInterval(this.senseTimeout);
                        node.senseTimeout = null;
                    }
                    outArray[node.currentPump + 1] = node.outputFlowDetected;
                    node.send(outArray);
                } else if (msg.payload.flow === 0 || msg.payload.flow === false || msg.payload.flow === "false") {
                    // no flow detected, so we'll try the other pump
                    node.stopPumps();
                    outArray[this.currentPump + 1] = this.outputNoFlowDetected;
                    node.send(outArray);
                    node.lockPump(node.currentPump);
                    node.currentPump = node.nextPumpNumber(node.currentPump);
                    node.cycleCount = 0;
                    node.nextCycle();
                }
            }
        };

        this.tripPump = function(msg){
            let pumpNum = msg.payload.value.pump;
            let tripVal = msg.payload.value.trip;
            if(tripVal === 1 || tripVal === true || tripVal === "true"){
                node.lockPump(pumpNum);
            } else if (tripVal === 0 || tripVal === false || tripVal === "false") {
                node.clearLock(pumpNum);
            }
        };

        node.on('input', function(msg){
            if(msg.payload.cmd === "startStop"){
                node.startStop(msg);
            } else if (msg.payload.cmd === "senseFlow") {
                node.senseFlow(msg);
            } else if (msg.payload.cmd === "pumpTrip") {
                node.tripPump(msg);
            }
        });

        this.nextCycle = function nextCycle(){
            // clear any interval just in case
            if(this.senseTimeout != null) {
                clearInterval(this.senseTimeout);
                this.senseTimeout = null;
            }
            if (!this.pumpLocked(this.currentPump) &&
                (this.belowCycleLimit() || this.pumpLocked(this.nextPumpNumber(this.currentPump)))) {
                // run this pump again.
                this.runPump();
            } else if (!this.pumpLocked(this.nextPumpNumber(this.currentPump)) &&
                (!this.belowCycleLimit() || this.pumpLocked(this.currentPump))) {
                // see if should switch current pump

                    // switch to the next node, reset cycle count, then run
                    this.currentPump = node.nextPumpNumber(this.currentPump);
                    this.cycleCount = 0;
                    this.runPump();
            } else {

                // OTHERWISE:  If we can't turn on either pump don't.
                this.running = false;
                this.updateStatus();
            }
        };

        this.stopPumps = function stopPumps(){
            // kill interval timeout watching for flow
            if(this.senseTimeout != null) {
                clearInterval(this.senseTimeout);
                this.senseTimeout = null;
            }

            this.cycleCount += 1; // increase the cycle count
            this.running = false;
            this.updateStatus();

            let outArray = Array(4).fill(null);
            outArray[this.currentPump - 1] = this.payloadFalse;
            node.send(outArray);
        };

        this.runPump = function runPump(){
            let outArray = Array(4).fill(null);
            outArray[this.currentPump - 1] = this.payloadTrue;
            this.running = true;
            node.send(outArray); // send the outputs to turn on the motor
            this.updateStatus();

            // Start call back to watch for flow signal
            this.senseTimeout = setInterval(function() {
                // this will only get called if we don't get a signal on the flow pin
                node.stopPumps();
                let output = Array(4).fill(null);
                output[node.currentPump + 1] = node.outputNoFlowDetected;
                node.lockPump(node.currentPump);
                node.send(output);
                node.currentPump = node.nextPumpNumber(node.currentPump);
                node.cycleCount = 0;
                node.nextCycle();
            }, this.flowSenseTimeout);
        };

        this.lockPump = function lockPump(pumpNumber){
            // lock out the pump
            if(pumpNumber === 1) {
                this.pumpOneLock = true;
            } else if (pumpNumber === 2) {
                this.pumpTwoLock = true;
            }

            this.updateStatus();

            if(this.running && this.currentPump === pumpNumber){
                this.stopPumps();
                this.nextCycle();
            }
        };

        this.clearLock = function clearLock(pumpNumber){
            let bothLocked = (node.pumpOneLock && node.pumpTwoLock);
            // clear the lockout
            if(pumpNumber === 1) {
                this.pumpOneLock = false;
            } else {
                this.pumpTwoLock = false;
            }
            this.updateStatus();
            // start running cycles if both were locked
            if(bothLocked && this.running){
                this.currentPump = pumpNumber;
                this.cycleCount = 0;
                this.runPump();
            }
        };

        this.belowCycleLimit = function(){
            if(this.currentPump === this.primaryPump){
                return (this.cycleCount < this.primaryCycles);
            } else {
                return (this.cycleCount < this.secondaryCycles);
            }
        };

        this.updateStatus = function updateStatus(){
            let statusText = "";
            // pump status
            if(this.pumpOneLock && !this.pumpTwoLock){
                statusText = ": Pump 1 Locked";
            } else if ( !this.pumpOneLock && this.pumpTwoLock) {
                statusText = ": Pump 2 Locked";
            } else if (this.pumpOneLock && this.pumpTwoLock) {
                 statusText = ": Pump 1 Locked, Pump 2 Locked";
            }

            if(this.running){
                statusText = "Running: Pump " + this.currentPump + statusText;
                this.status({fill:"green",shape:"dot",text:statusText});
            } else {
                statusText = "Stopped" + statusText;
                this.status({fill:"red",shape:"dot",text:statusText});
            }
        };

        // helper functions
        this.pumpLocked = function pumpLocked(pumpNumber){
            if(pumpNumber === 1) {
                return this.pumpOneLock;
            } else {
                return this.pumpTwoLock;
            }
        };

        this.nextPumpNumber = function nextPumpNumber(pumpNumber){
            return (pumpNumber % 2) + 1;
        }
    }

    RED.nodes.registerType("smithtek_dutycontrol", DutyControlNode);
}