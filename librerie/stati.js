stringa.STATI_INIZIALI = dati.macchine
	.get("stato iniziale")
	.getID()
	.toString();

// Prendi i campi "da", trasformali in ID, tabulali
stringa.PARTENZA = dati.transizioni
	.get("da")
	.getID()
	.toString();
// Prendi i campi "a", trasformali in ID, tabulali
stringa.ARRIVO = dati.transizioni
	.get("a")
	.getID()
	.toString();