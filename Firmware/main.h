#define UART_TXD  		BIT2
#define UART_RXD  		BIT1

#define HSENSOR_CHANNEL INCH_0
#define HSENSOR_BIT 	BIT0
#define HSENSOR_VCC 	BIT4

#define INDICATOR		BIT6



#define HSENSOR_ON 		P1OUT |= HSENSOR_VCC;__delay_cycles(16000);
#define HSENSOR_OFF 	P1OUT &= ~HSENSOR_VCC;


void init_UART(void);
void init_ADC(void);
int get_HumiditySensorData(void);
void send_HumiditySensorData(int data);
