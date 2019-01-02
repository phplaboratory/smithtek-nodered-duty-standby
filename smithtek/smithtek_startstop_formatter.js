module.exports = function(RED){
    function StartStopFormatter(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.on('input', function(msg){
           node.send({"payload":{"cmd":"startStop", "value":msg.payload}});
        });
    }

    RED.nodes.registerType("smithtek_duty_start_stop", StartStopFormatter);
};