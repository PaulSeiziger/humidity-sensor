var config = {}


config.server_port = 8080;
config.com_port = 'COM3';
config.com_baudrate = 9600;
config.com_dataBits = 8;
config.com_parity = 'none';
config.com_stopBits = 1;
config.commands = {get_humidity: 0x01};


module.exports = config;