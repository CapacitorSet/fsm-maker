#include <stdint.h>
#include <stdio.h>

#define BIT(n)          (1 << n)
#define NTH_BIT(x, n)   ((BIT(n) & x) >> n)

#define NUM_MACCHINE    (/*NUM_MACCHINE*/)
#define NUM_TRANSIZIONI (/*NUM_TRANSIZIONI*/)
#define NUM_INGRESSI    (/*NUM_INGRESSI*/)

#define BUS_ENABLED /*BUS_ENABLED*/ // Esistono variabili sul bus?
#define DEBOUNCE_ENABLED /*DEBOUNCE_ENABLED*/ // Esiste almeno un dispositivo per cui il debounce è abilitato?

#if NUM_MACCHINE == 1
	#define MULTIPLE_FSMS 0
#else
	#define MULTIPLE_FSMS 1
#endif

typedef uint32_t io_t;
typedef int      stato_t;

io_t    raw_inputs, inputs, outputs, bus, new_bus;

#define STATI /*STATI_INIZIALI*/

#if MULTIPLE_FSMS
	// Lo stato di ciascuna macchina
	stato_t stato[] = {STATI};

	// L'ID di macchina per cui e' valida una transizione
	const uint8_t fsm_id[] = {/*FSM_ID*/};
#else
	stato_t stato = STATI;
#endif
// Gli stati di partenza
const stato_t partenza[] = {/*PARTENZA*/};
// Gli stati di arrivo
const stato_t arrivo[] = {/*ARRIVO*/};

// Gli ingressi fisici considerati per una transizione
const io_t port_in_bitmask[] = {/*PORT_IN_BITMASK*/};
// I valori attesi degli ingressi fisici perche' si faccia la transizione
const io_t port_in_valori[] = {/*PORT_IN_VALORI*/};
// Le uscite fisiche modificate da una transizione
const io_t port_out_bitmask[] = {/*PORT_OUT_BITMASK*/};
// I valori scritti su una porta fisica da una transizione
const io_t port_out_valori[] = {/*PORT_OUT_VALORI*/};

#if BUS_ENABLED
// Gli ingressi di bus considerati per una transizione
const io_t bus_in_bitmask[] =  {/*BUS_IN_BITMASK*/};
// I valori attesi degli ingressi di bus perche' si faccia la transizione
const io_t bus_in_valori[] = {/*BUS_IN_VALORI*/};
// Le uscite di bus modificate da una transizione
const io_t bus_out_bitmask[] = {/*BUS_OUT_BITMASK*/};
// I valori scritti su una porta virtuale da una transizione
const io_t bus_out_valori[] = {/*BUS_OUT_VALORI*/};
#endif

#if DEBOUNCE_ENABLED
const uint8_t debounced[] = {/*INGRESSI_DEBOUNCED*/};
uint8_t input_counts[] = {/*INPUT_COUNTS*/};
#endif

int main() {
	int i, counter = 0;

	raw_inputs = inputs = /*INPUT_INIZIALI*/;

#if BUS_ENABLED
	printf("Bus abilitato.\n");
#else
	printf("Bus disabilitato.\n");
#endif

#if DEBOUNCE_ENABLED
	printf("Debounce abilitato.\n");
#else
	printf("Debounce disabilitato.\n");
#endif

#if MULTIPLE_FSMS
	printf("Modalita' FSM multiple.\n");
#else
	printf("Modalita' FSM singola.\n");
#endif

// Il loop inizia da qua

	// raw_inputs = PORTA

#if DEBOUNCE_ENABLED
	counter++;
	counter %= /*INTERVALLO*/;

	if (counter == 0) {
		for (i = 0; i < NUM_INGRESSI; i++) {
			#define ingresso ( !!( raw_inputs & (1 << i) ) )
			#define count (input_counts[i])

			if (!debounced[i]) {
				if (ingresso)
					inputs |=  (1 << i); // Set
				else
					inputs &= ~(1 << i); // Clear
				continue;
			}

			if (ingresso && count != 0xFF)
				count++;
			else if (!ingresso && count != 0x00)
				count--;

			// Trigger di Schmitt
			if ((ingresso && count < /*SOGLIA_BASSA*/) || (!ingresso && count > /*SOGLIA_ALTA*/))
				inputs ^= BIT(i); // Toggle
		}
	}
#endif

#if MULTIPLE_FSMS
	for (int IDMacchina = 0; IDMacchina < NUM_MACCHINE; IDMacchina++) {
		#define stato_attuale (stato[IDMacchina])
#else
	#define IDMacchina (0)
	#define stato_attuale (stato)
	{
#endif
		printf("Stato iniziale della macchina %i: %i\n", IDMacchina, stato_attuale);

		for (i = 0; i < NUM_TRANSIZIONI; i++) {
#if MULTIPLE_FSMS
			// ID macchina non corrispondente? passa al prossimo
			if (fsm_id[i] != IDMacchina) continue;
#endif
			// stato non corrispondente? passa
			if (stato_attuale != partenza[i]) continue;
			// porte fisiche di ingresso non corrispondenti? passa
			if ((inputs & port_in_bitmask[i]) != port_in_valori[i]) continue;
#if BUS_ENABLED
			// porte virtuali di ingresso non corrispondenti? passa
			if ((bus & bus_in_bitmask[i]) != bus_in_bitmask[i]) continue;
#endif
			// se sei qua, lo stato e le condizioni corrispondono
			stato_attuale = arrivo[i];

			// Clear
			outputs &= ~port_out_bitmask[i];
			// Set
			outputs |= port_out_valori[i];

#if BUS_ENABLED
			// Scrivi le modifiche in un buffer.
			// Clear
			new_bus &= ~bus_out_bitmask[i];
			// Set
			new_bus |= bus_out_valori[i];
#endif
			break;
		}
		// Verifica che la transizione e' avvenuta
		printf("Stato finale della macchina %i: %i, output finali: %i\n", IDMacchina, stato_attuale, outputs);
	}
	// Flusha il buffer in bus.
	bus = new_bus;

// e finisce qua

	return 0;
}