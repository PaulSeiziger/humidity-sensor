#include "msp430.h"
#include "main.h"

void main(void)
{
  char command = 0x00;

  WDTCTL = WDT_MRST_32; // Watchdog автоматически
                        // перезапустит систему через 32ms.

  //WDTCTL = WDTPW | WDTHOLD;

  BCSCTL1 = CALBC1_1MHZ; // Устанавливаем тактовую частоту Basic Clock System.
  DCOCTL = CALDCO_1MHZ; // Устанавливаем тактовую
                        // частоту Digital Controlled Oscillator.

  P1DIR |= INDICATOR + HSENSOR_VCC; // Настройка светодиода и питания датчика.
  P1OUT &= ~(INDICATOR + HSENSOR_VCC);

  init_UART();
  init_ADC();


  while(1)
  {

	while (!(IFG2&UCA0RXIFG)) // Проверка готовности буфера приёма.

	WDTCTL = WDTPW + WDTCNTCL; //Сброс watchdog

	command = UCA0RXBUF;

	if (command == 0x01){
		send_HumiditySensorData(
				get_HumiditySensorData()
		);

		//Переключить светодиод
		P1OUT ^= INDICATOR;
	}
	/*else
	{
		send_HumiditySensorData(command);
	}*/


  }
}


void init_UART(void)
{
	P1DIR |= UART_RXD;
	P1OUT &= ~UART_RXD;

	P1DIR &= ~UART_TXD;

	P1SEL  = UART_RXD + UART_TXD;      // настраиваем линии порта
	P1SEL2 = UART_RXD + UART_TXD;

	UCA0CTL1 |= UCSWRST; // Этот бит блокирует работу прерываний от UART и работу
					   // сдвигового регистра чтобы не мешать
					   // настройке (грубо говоря отключает UART).
	UCA0CTL1 |= UCSSEL_2; // Наш UART будет работать от
						// SMCLK (Sub-main clock), тоесть от 1MHZ.
	UCA0BR0 = 0x68; // Делитель частоты для SMCLK (1000000 / 9600).
	UCA0BR1 = 0x00;
	UCA0MCTL = 0x04; // Определяет маску модуляции.
				  // Это помогает минимизировать ошибки.
	UC0IE |= UCA0RXIE;
	UCA0CTL1 &= ~UCSWRST; // Включаем UART обратно.

}

void init_ADC(void)
{
	P1DIR &= ~HSENSOR_BIT;
	P1SEL |= HSENSOR_BIT;

	ADC10CTL0 &= ~ENC;
	ADC10CTL0 = SREF_0 + ADC10SHT_2 + ADC10ON;

	// Вход A0, делитель ADC10CLK на 1, одноканальный режим.
	ADC10CTL1 =  HSENSOR_CHANNEL + SHS_0 + ADC10SSEL_0 + ADC10DIV_0 + CONSEQ_0;


	ADC10AE0 = HSENSOR_BIT;      // Разрешаем вход АЦП на порту P1.0

	ADC10CTL0 |= ENC;     // Разрешаем преобразования.
}


int get_HumiditySensorData(void)
{
	HSENSOR_ON;

	ADC10CTL0 |= ADC10SC;   // начинаем новое преобразование
	while ((ADC10CTL1 & ADC10BUSY) == 0x01); // ждем, когда преобразование закончится

	HSENSOR_OFF;

	return ADC10MEM;  // конвертируем результат в напряжение и сохраняем
}


void send_HumiditySensorData(int data)
{
	while (!(IFG2 & UCA0TXIFG)); // Проверка готовности буфера отправки.
	UCA0TXBUF = (char)(data >> 8);


	while (!(IFG2 & UCA0TXIFG)); // Проверка готовности буфера отправки.
	UCA0TXBUF = (char)data;
}


