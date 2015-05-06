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

var humidity_buffer = new Buffer(2); //Данный буфер необходим для приема байт приходящих отдельно друг от друга, а не в один буфер.
var humidity_pointer = 0;

serialPort.on("open", function () {
	console.log('Connected...');

	serialPort.on('data', function(data) {
		console.log(data);
		//Нужно чтобы входящий пакет состоял хотя бы из 2-х байт (если больше остальные учитываться не будут)
		if(data.length >= 2){
			humidity_value = (data[0] << 8) | data[1];
			humidity_pointer = 0;
		}else{

			//если за раз удалось захватить лишь один байт помещаем его в буфер
			humidity_buffer[humidity_pointer] = data[0];
			humidity_pointer++;

			if (humidity_pointer == 2){
				console.log('Union buffer');
				console.log(humidity_buffer);
				console.log('---------------------------------------------------');
				humidity_value = (humidity_buffer[0] << 8) | humidity_buffer[1];
				humidity_pointer = 0;
			}

		}
		
	});

	serialPort.on('error', function(err) {
	  console.log(err);
	});

	//Получаем первое значение датчика
	var buffer = new Buffer(1);
	buffer.writeUInt8(config.commands.get_humidity, 0);
	serialPort.write(buffer);
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
	var cfg = JSON.stringify(req.body);
	fs.writeFile(__dirname + '/config/gui_config.json', cfg ,function (err) {
		if (err) throw err;
		res.end('Ошибка сохранения конфигурации');
	});
	//console.log(req.body);
});

//Показ главной страницы
app.get('/', function (req, res) {
	res.redirect('index.html')
});


app.listen(config.server_port);