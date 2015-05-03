$(document).ready(function (){
	var config = {};

	//Загрузка конфигурации интерфейса
	$.get('/get_config', function(data){
		config = data;
		$('#low').val(data.humidity_low);
		$('#high').val(data.humidity_high);
		$('#interval').val(data.interval);
		$('#animation_time').val(data.animation_time);




		function getHumibility(){
			$.get('/humidity',function (data){
				//$('.content').html(data);

				if(parseInt(data) < config.humidity_low){
					$('body').animate({backgroundColor: '#2D95BF'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Очень высокая');
				}

				if(parseInt(data) > config.humidity_high){
					$('body').animate({backgroundColor: '#F0C419'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Очень низкая');
				}

				if((parseInt(data) >= config.humidity_low) && (parseInt(data) <= config.humidity_high)){
					$('body').animate({backgroundColor: '#4EBA6F'}, config.animation_time);
					$('h1').html('Влажность почвы:<br/>Нормальная');
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