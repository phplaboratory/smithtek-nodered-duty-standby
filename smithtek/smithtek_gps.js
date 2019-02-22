module.exports = function(RED){
    function SmithtekGps(config) {
        RED.nodes.createNode(this, config);

        var node = this;


        node.on('input', function(msg){
            var m = {}
            m.payload ={};
            m.topic = "/v1.6/devices";
            m.payload = {"value":1, "context":{} };


            var lat_rawData = new ArrayBuffer(4);
            var lat_intView = new Uint16Array(lat_rawData);
            var lat_fltView = new Float32Array(lat_rawData);
            lat_intView[0] = msg.payload[1]; //low
            lat_intView[1] = msg.payload[0]; //high
            var lat_nb= parseFloat(lat_fltView);
            var lat_raw = Math.abs(lat_nb)
            var lat_deg = Math.floor(lat_raw / 100)
            var lat_dec = (lat_raw - (100 * lat_deg)) / 60
            m.payload["context"]["lat"]= (lat_deg + lat_dec)*Math.sign(lat_nb);

            var lng_rawData = new ArrayBuffer(4);
            var lng_intView = new Uint16Array(lng_rawData);
            var lng_fltView = new Float32Array(lng_rawData);
            lng_intView[0] = msg.payload[3]; //low
            lng_intView[1] = msg.payload[2]; //high
            var lng_nb= parseFloat(lng_fltView);
            var lng_raw = Math.abs(lng_nb)
            var lng_deg = Math.floor(lng_raw / 100)
            var lng_dec = (lng_raw - (100 * lng_deg)) / 60
            m.payload["context"]["lng"]= (lng_deg + lng_dec)*Math.sign(lng_nb);




            // const lat_arr = new Uint16Array(2);
            // lat_arr[0] = msg.payload[1];
            // lat_arr[1] = msg.payload[0];
            //
            // var lat_nb = (new DataView(lat_arr.buffer)).getFloat32(0)
            // var lat_raw = Math.abs(lat_nb)
            // var lat_deg = Math.floor(lat_raw / 100)
            // var lat_dec = (lat_raw - (100 * lat_deg)) / 60
            //
            //
            // const lng_arr = new Uint16Array(2);
            // lng_arr[0] = msg.payload[3];
            // lng_arr[1] = msg.payload[2];
            // var lng_nb = (new DataView(lng_arr.buffer)).getFloat32(0)
            // var lng_raw = Math.abs(lng_nb)
            // var lng_deg = Math.floor(lng_raw / 100)
            // var lng_dec = (lng_raw - (100 * lng_deg)) / 60
            //
            // m.payload["position"] = {"value":1, "context":
            //     {    'lat': (lat_deg + lat_dec)*Math.sign(lat_nb),
            //         'lng': (lng_deg + lng_dec)*Math.sign(lng_nb)
            //     }
            // };



            node.status({fill:"blue",shape:"ring",
                text:
                    m.topic  + ":" +
                    "lat:" + m.payload["context"]["lat"] +
                    ",lng:"+ m.payload["context"]["lng"]
            });

           node.send(m);
        });
    }

    RED.nodes.registerType("smithtek_gps", SmithtekGps);
};