#include <stdint.h>
#include <stdio.h>

#define NUM_TRANSIZIONI (/*NUM_TRANSIZIONI*/)
#define NUM_INGRESSI    (/*NUM_INGRESSI*/)
#define BIT(n)          (1 << n)
#define NTH_BIT(x, n)   ((BIT(n) & x) >> n)

typedef uint32_t io_t;
typedef int      stato_t;
typedef uint16_t tensione_t;

stato_t	stato;
io_t	inputs;
io_t    outputs;

// Gli stati di partenza
stato_t partenza[] = {/*PARTENZA*/};

// Gli stati di arrivo
stato_t arrivo[] = {/*ARRIVO*/};

// Le condizioni (= valori da considerare) per la transizione
io_t condizioni[] = {/*CONDIZIONI*/};

// I valori attesi per le condizioni
io_t attesi[] = {/*ATTESI*/};

// Le uscite per una transizione
io_t uscite[] = {/*USCITE*/};

// ---

tensione_t stati_RC[] = {/*STATI_RC*/};

uint8_t debounced[] = {/*INGRESSI_DEBOUNCED*/};

void init() {
	stato = /*STATO_INIZIALE*/;
	inputs = /*INPUTS_INIZIALI*/;
	return;
}

int main() {
	int i;

	init();

// Il loop inizia da qua

	// inputs = PORTA

	printf("Stato iniziale: %i\n", stato);

	for (i = 0; i < NUM_INGRESSI; i++) {
		#define uscitaRC (stati_RC[i])

		if (debounced[i]) {
			// Filtro RC digitale
			#define ingresso ( !!( inputs & (1 << i) ) )
			uscitaRC += (65535 * ingresso - uscitaRC) >> /*COSTANTE_PER_RC*/;

			// Trigger di Schmitt
			if ((ingresso && uscitaRC < /*SOGLIA_BASSA*/) || (!ingresso && uscitaRC > /*SOGLIA_ALTA*/)) {
				// toggle
				inputs ^= BIT(i);
			}
		}

		// printf("Ingresso %i: filtro RC %i, ingresso pulito %i\n", i, uscitaRC, ingresso);
	}

	for (i = 0; i < NUM_TRANSIZIONI; i++) {
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

// e finisce qua

	return 0;
}