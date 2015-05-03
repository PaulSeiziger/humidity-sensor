var http = require('http');
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
 

var config = require(__dirname + '/config/server_config.js');

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
		//Нужно чтобы входящий пакет состоял из 2-х байт
		console.log(data);
		if(data.length == 2){
			humidity_value = (data[0] << 8) | data[1];
		}
	});

	serialPort.on('error', function(err) {
	  console.log(err);
	});
});


app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//Запрос данных о влажности
app.get('/humidity', function (req, res) {
	var buffer = new Buffer(1);
	buffer.writeUInt8(config.commands.get_humidity, 0);
	serialPort.write(buffer);

    res.end(humidity_value.toString());
});

//Загрузка текущей конифгурации интерфейса
app.get('/get_config', function (req, res) {
	fs.readFile(__dirname + '/config/gui_config.json', function (err, data) {
		if (err) throw err;
		
		res.set('Content-Type', 'application/json');
		res.end(data);
	});
});

//Сохранение конфигурации
app.post('/set_config', function (req, res) {
	console.log(req.body);
});

//Показ главной страницы
app.get('/', function (req, res) {
	res.redirect('index.html')
});


app.listen(config.server_port);