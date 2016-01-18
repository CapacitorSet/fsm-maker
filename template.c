#include <stdint.h>
#include <stdio.h>

#define NUM_TRANSIZIONI /*NUM_TRANSIZIONI*/
#define BIT(n)      2 << n
#define ALTO(n)     BIT(n)
#define BASSO(n)    0
#define E |

typedef uint32_t io_t;
typedef int      stato_t;

stato_t	stato;
io_t	inputs;
io_t    outputs;

stato_t partenza[] = {/*PARTENZA*/};

stato_t arrivo[] = {/*ARRIVO*/};

io_t condizioni[] = {/*CONDIZIONI*/};

io_t attesi[] = {/*ATTESI*/};

io_t uscite[] = {/*USCITE*/};

void init() {
	stato = /*STATO_INIZIALE*/;
	inputs = /*INPUTS_INIZIALI*/;
	return;
}

int main() {
	init();

	printf("Stato iniziale: %i\n", stato);

	for (int i = 0; i < NUM_TRANSIZIONI; i++) {
		// stato non corrispondente? passa al prossimo
		if (stato != partenza[i]) continue;
		// condizioni non corrispondenti? passa al prossimo
		if ((inputs & condizioni[i]) != attesi[i]) continue;
		// se sei qua, lo stato e le condizioni corrispondono
		stato = arrivo[i];
		outputs = uscite[i];
		break;
	}
	// Verifica che la transizione e' avvenuta
	printf("Stato finale: %i, output finali: %i\n", stato, outputs);
	return 0;
}