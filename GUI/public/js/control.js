$(document).ready(function (){
	var config = {};

	//Загрузка конфигурации интерфейса
	$.get('/get_config', function(data){
		config = data;
		$('#low').val(data.humidity_low);
		$('#high').val(data.humidity_high);
		$('#interval').val(data.interval);
		$('#animation_time').val(data.animation_time);
		$('#hysteresis').val(data.hysteresis);
		$('#stopscan_time').val(data.stopscan_time);




		function getHumibility(){
			$.get('/humidity',function (data){
				//$('.content').html(data);
				var current_sensor_data = parseInt(data.value);
				var low_with_hysteresis = parseInt(config.humidity_low) + parseInt(config.hysteresis);
				var high_with_hysteresis = parseInt(config.humidity_high) - parseInt(config.hysteresis);

				if(data.status == "high") {
					$('body').animate({backgroundColor: '#2D95BF'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Очень высокая');

				} else if(data.status == "low") {
					$('body').animate({backgroundColor: '#F0C419'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Очень низкая');

				} else if(data.status == "medium") {
					$('body').animate({backgroundColor: '#4EBA6F'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Нормальная');
				} else {
					$('body').animate({backgroundColor: '#F15A5A'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Не определена');
				}
			});
		}


		setInterval(getHumibility, config.interval);

	}, 'json');


	$('.send_config').click(function() {
		config.humidity_low = $('#low').val();
		config.humidity_high = $('#high').val();
		config.interval = $('#interval').val();
		config.animation_time = $('#animation_time').val();
		config.hysteresis = $('#hysteresis').val();
		config.stopscan_time = $('#stopscan_time').val();

		$.post('/set_config', config, function(data){
			location.reload();
		});
	});

	$('.show_config').click(function (){
		$('.config_window').fadeIn(config.animation_time);
	});

	$('.close_config').click(function (){
		$('.config_window').fadeOut(config.animation_time);
	});

});