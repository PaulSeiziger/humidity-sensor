var http = require('http');
var express = require('express');
var app = express();

var config = require(__dirname + '/config/config.js');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var serialPort = new SerialPort(config.com_port, {
  baudrate: config.com_baudrate,
  dataBits: config.com_dataBits,
  parity: config.com_parity,
  stopBits: config.com_stopBits
});

var humidity_value = 0;


serialPort.on("open", function () {
  console.log('Connected...');


	serialPort.on('data', function(data) {
		humidity_value = (data[0] << 8) | data[1];
	});

	serialPort.on('error', function(err) {
	  console.log(err);
	});
});


app.use(express.static(__dirname + '/public'));

app.get('/humidity', function (req, res) {
	var buffer = new Buffer(1);
	buffer.writeUInt8(config.commands.get_humidity, 0);
	serialPort.write(buffer);

    res.end(humidity_value.toString());
});

app.get('/', function (req, res) {
	res.redirect('index.html')
});


app.listen(config.server_port);