#include <stdint.h>
#include <stdio.h>

#define NUM_TRANSIZIONI /*NUM_TRANSIZIONI*/
#define BIT(n)      2 << n
#define ALTO(n)     BIT(n)
#define BASSO(n)    0
#define E |

typedef uint32_t input_t;
typedef int      stato_t;

stato_t	stato;
input_t	inputs;

stato_t partenza[] = {
/*PARTENZA*/
	0
};

stato_t arrivo[] = {
/*ARRIVO*/
	0
};

input_t condizioni[] = {
/*CONDIZIONI*/
	0
};

input_t attesi[] = {
/*ATTESI*/
	0
};

void init() {
	stato = /*STATO_INIZIALE*/;
	inputs = /*INPUTS_INIZIALI*/;
	return;
}

int main() {
	init();

	for (int i = 0; i < NUM_TRANSIZIONI; i++) {
		// stato non corrispondente? passa al prossimo
		if (stato != partenza[i]) continue;
		// condizioni non corrispondenti? passa al prossimo
		if ((inputs & condizioni[i]) != attesi[i]) continue;
		// se sei qua, lo stato e le condizioni corrispondono
		stato = arrivo[i];
		break;
	}
	// Verify that the transition worked
	printf("%i", stato);
	return 0;
}