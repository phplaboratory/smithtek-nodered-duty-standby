module.exports = function(RED){
    function PumpTripFormatter(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        this.pumpNumber = config.pumpNumber;

        node.on('input', function(msg){
            output = {"payload":{"cmd":"pumpTrip","value":{"pump":node.pumpNumber,"trip":msg.payload}}};
            node.send(output);
        });
    }

    RED.nodes.registerType("smithtek_duty_pumptrip", PumpTripFormatter);
};