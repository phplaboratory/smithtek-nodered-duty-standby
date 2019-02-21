module.exports = function(RED){
    function SmithtekGps(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        this.topic = config.topic;

        node.on('input', function(msg){

            const lat_arr = new Uint16Array(2);
            lat_arr[0] = msg.payload[1];
            lat_arr[1] = msg.payload[0];

            var lat_nb = (new DataView(lat_arr.buffer)).getFloat32(0)
            var lat_raw = Math.abs(lat_nb)
            var lat_deg = Math.floor(lat_raw / 100)
            var lat_dec = (lat_raw - (100 * lat_deg)) / 60


            const lng_arr = new Uint16Array(2);
            lng_arr[0] = msg.payload[3];
            lng_arr[1] = msg.payload[2];
            var lng_nb = (new DataView(lng_arr.buffer)).getFloat32(0)
            var lng_raw = Math.abs(lng_nb)
            var lng_deg = Math.floor(lng_raw / 100)
            var lng_dec = (lng_raw - (100 * lng_deg)) / 60

            var m = {}
            m.payload ={};
            m.payload["position"] = {"value":1, "context":
                {    'lat': (lat_deg + lat_dec)*Math.sign(lat_nb),
                    'lng': (lng_deg + lng_dec)*Math.sign(lng_nb)
                }
            };
            m.topic = node.topic;


            node.status({fill:"blue",shape:"ring",
                text:
                    m.topic  + ":" +
                    "lat:" + m.payload["position"]["context"]["lat"] +
                    ",lng:"+ m.payload["position"]["context"]["lng"]
            });

           node.send(m);
        });
    }

    RED.nodes.registerType("smithtek_gps", SmithtekGps);
};