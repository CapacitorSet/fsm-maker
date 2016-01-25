stringa.STATI_INIZIALI = dati.macchine
	.map(get("stato iniziale"))
	.map(getID)
	.toString();

// Prendi i campi "da", trasformali in ID, tabulali
stringa.PARTENZA = dati.transizioni
	.map(get("da"))
	.map(getID)
	.toString();
// Prendi i campi "a", trasformali in ID, tabulali
stringa.ARRIVO = dati.transizioni
	.map(get("a"))
	.map(getID)
	.toString();