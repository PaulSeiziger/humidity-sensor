var http = require('http');
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var serialport = require("serialport");
 

var config = require(__dirname + '/config/server_config.js');
var gui_config = require(__dirname + '/config/gui_config.json');

var SerialPort = serialport.SerialPort;
var serialPort = new SerialPort(config.com_port, {
  baudrate: config.com_baudrate,
  dataBits: config.com_dataBits,
  parity: config.com_parity,
  stopBits: config.com_stopBits
});

var sensor_request = {};
var count_request = 0;

var humidity_value = 0;

var humidity_buffer = new Buffer(2); //Данный буфер необходим для приема байт приходящих отдельно друг от друга, а не в один буфер.
var humidity_pointer = 0;






/*
	*	*********************************************************************************************************************************************
	*	Получение данных от датчика и их парсинг
	*	*********************************************************************************************************************************************
*/

function sendCommandIntoSensor(command) {
	var buffer = new Buffer(1);
	buffer.writeUInt8(command, 0);
	serialPort.write(buffer);
}

function stopScan() {

	clearInterval(sensor_request);

	count_request = 0;
	console.log('Scan Disable');

}

serialPort.on("open", function () {
	console.log('Connected...');


	serialPort.on('data', function(data) {
		
		//Нужно чтобы входящий пакет состоял хотя бы из 2-х байт (если больше остальные учитываться не будут)
		if(data.length >= 2) {
			humidity_value = (data[0] << 8) | data[1];
			humidity_pointer = 0;

			console.log('<Value ' + humidity_value + '>');

		} else {
			//если за раз удалось захватить лишь один байт помещаем его в буфер
			humidity_buffer[humidity_pointer] = data[0];
			humidity_pointer++;

			if (humidity_pointer == 2) {
				humidity_value = (humidity_buffer[0] << 8) | humidity_buffer[1];
				humidity_pointer = 0;

				console.log('<Value ' + humidity_value + '>');

			}

		}
		
	});


	serialPort.on('error', function(err) {
	  console.log(err);
	});


	//Получаем первое значение датчика
	sendCommandIntoSensor(config.commands.get_humidity);
	setInterval(stopScan, gui_config.stopscan_time);
});





/*
	*	*********************************************************************************************************************************************
	*	Настройка express
	*	*********************************************************************************************************************************************
*/

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
})); 









/*
	*	*********************************************************************************************************************************************
	*	Обработка запросов из браузера
	*	*********************************************************************************************************************************************
*/

//Запрос данных о влажности
app.get('/humidity', function (req, res) {
	//Если Сканирование отключено включаем его.
	if (count_request == 0){
		sensor_request = setInterval(sendCommandIntoSensor, gui_config.interval, config.commands.get_humidity);
		console.log('Scan Enable');
	}

	count_request++;

	var low_with_hysteresis = parseInt(gui_config.humidity_low) - parseInt(gui_config.hysteresis);
	var high_with_hysteresis = parseInt(gui_config.humidity_high) + parseInt(gui_config.hysteresis);

	var status = '';

	//Определяем значение показаний датчика
	if(humidity_value < gui_config.humidity_high) {
		status = 'high';
	} else if(humidity_value > gui_config.humidity_low) {
		status = 'low';
	} else if((humidity_value >= high_with_hysteresis) &&  (humidity_value <= low_with_hysteresis)) {
		status = 'medium';
	}

	json_package = {
		'value': humidity_value.toString(),
		'status': status
	};

	res.set('Content-Type', 'application/json');
    res.end(JSON.stringify(json_package));
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
	gui_config = req.body;


	//Перезагружаем конфигурацию опроса датчика
	clearInterval(sensor_request);
	sensor_request = setInterval(sendCommandIntoSensor, req.body.interval, config.commands.get_humidity);

	fs.writeFile(__dirname + '/config/gui_config.json', cfg ,function (err) {
		if (err) throw err;
		res.end('Save configuration was failed!');
	});
});

//Показ главной страницы
app.get('/', function (req, res) {
	res.redirect('index.html')
});


app.listen(config.server_port);