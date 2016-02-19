stringa.DEBOUNCE_ENABLED = Number(dati.antirimbalzo.porte.length != 0);

if (stringa.DEBOUNCE_ENABLED) {

stringa.INPUT_COUNTS = dati.io.input.map(x => 127).toString();
stringa.INGRESSI_DEBOUNCED = dati.io.input
	.map(x => dati.antirimbalzo.porte.indexOf(x) != -1)
	.map(Number)
	.toString();

stringa.SOGLIA_BASSA = dati.antirimbalzo.schmitt.basso; // 0..255
stringa.SOGLIA_ALTA = dati.antirimbalzo.schmitt.alto; // 0..255
stringa.INTERVALLO = dati.antirimbalzo.schmitt.intervallo || 1; // Defaulta a 1

}