#include <stdint.h>
#include <stdio.h>

#define NUM_MACCHINE    (/*NUM_MACCHINE*/)
#define NUM_TRANSIZIONI (/*NUM_TRANSIZIONI*/)
#define NUM_INGRESSI    (/*NUM_INGRESSI*/)

#define SOGLIA_BASSA (/*SOGLIA_BASSA*/)
#define SOGLIA_ALTA  (/*SOGLIA_ALTA*/)

#define BUS_ENABLED /*BUS_ENABLED*/ // Esistono variabili sul bus?
#define DEBOUNCE_ENABLED /*DEBOUNCE_ENABLED*/ // Esiste almeno un dispositivo per cui il debounce è abilitato?
#define HOOKS_ENABLED /*HOOKS_ENABLED*/ // Sono abilitati gli snippet eseguiti su una transizione?

#if NUM_MACCHINE == 1
	#define MULTIPLE_FSMS 0
#else
	#define MULTIPLE_FSMS 1
#endif

typedef uint32_t io_t;
typedef int      stato_t;

io_t    raw_inputs, inputs, outputs;
#if BUS_ENABLED
	io_t bus, new_bus;
#endif

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

#if HOOKS_ENABLED
	#define HOOKS /*HOOKS*/
	#include "hooks.c"

	#if BUS_ENABLED
		void nop(const io_t inputs, io_t outputs, const io_t bus, io_t new_bus) {
			return;
		}

		void (*hooks[])(const io_t inputs, io_t outputs, const io_t bus, io_t new_bus) = {HOOKS};
	#else
		void nop(const io_t inputs, io_t outputs) {
			return;
		}

		void (*hooks[])(const io_t inputs, io_t outputs) = {HOOKS};
	#endif
#endif

int main() {
	int i, counter = 0;

	raw_inputs = inputs = /*INPUT_INIZIALI*/;

	#if BUS_ENABLED
		#pragma message "Bus abilitato."
	#else
		#pragma message "Bus disabilitato."
	#endif

	#if DEBOUNCE_ENABLED
		#pragma message "Debounce abilitato."
	#else
		#pragma message "Debounce disabilitato."
	#endif

	#if MULTIPLE_FSMS
		#pragma message "Modalita' FSM multiple."
	#else
		#pragma message "Modalita' FSM singola."
	#endif

	#if HOOKS_ENABLED
		#pragma message "Hook abilitati."
	#else
		#pragma message "Hook disabilitati."
	#endif

// Il loop inizia da qua

	// raw_inputs = PORTA

	#if DEBOUNCE_ENABLED
		#define INTERVALLO /*INTERVALLO*/
		#if INTERVALLO > 1
			counter++;
			counter %= /*INTERVALLO*/;

			if (counter == 0) {
		#else
			{
		#endif
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
				if ((ingresso && count < SOGLIA_BASSA) || (!ingresso && count > SOGLIA_ALTA))
					inputs ^= BIT(i); // Toggle
			}
		}
	#endif

	#if MULTIPLE_FSMS
		int IDMacchina;
		#define stato_attuale (stato[IDMacchina])
		for (IDMacchina = 0; IDMacchina < NUM_MACCHINE; IDMacchina++) {
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

			#if HOOKS_ENABLED
				#if BUS_ENABLED
					hooks[i](inputs, outputs, bus, new_bus);
				#else
					hooks[i](inputs, outputs);
				#endif
			#endif
			break;
		}
		// Verifica che la transizione e' avvenuta
		printf("Stato finale della macchina %i: %i, output finali: %i\n", IDMacchina, stato_attuale, outputs);
	}
	#if BUS_ENABLED
		// Flusha il buffer in bus.
		bus = new_bus;
	#endif

// e finisce qua

	return 0;
}