module.exports = function(RED){
    function SenseFlowFormatter(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.on('input', function(msg){
           node.send({"payload":{"cmd":"senseFlow", "flow":msg.payload}});
        });
    }

    RED.nodes.registerType("smithtek_duty_senseflow", SenseFlowFormatter);
};