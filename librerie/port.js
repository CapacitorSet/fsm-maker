stringa.INPUT_INIZIALI = dati["input iniziali"].toBitmask(dati.io.input);
stringa.NUM_INGRESSI = dati.io.input.length;

// Prendi i campi "condizioni", considera solo gli i/o fisici, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.PORT_IN_BITMASK = dati.transizioni
	.map(get("condizioni"))
	.map(Object.keys)
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();
// Prendi i campi "condizioni", considera solo gli i/o fisici, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.PORT_IN_VALORI = dati.transizioni
	.map(get("condizioni"))
	.map(d => Object.keys(d).filter(x => d[x] == "1"))
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();

// Prendi i campi "uscite", considera solo gli i/o fisici, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.PORT_OUT_BITMASK = dati.transizioni
	.map(d => {
		// Se non ci sono uscite, defaulta a []
		if (!d.uscite) d.uscite = [];
		return d;
	})
	.map(get("uscite"))
	.map(Object.keys)
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.output))
	.toString();
// Prendi i campi "uscite", considera solo gli i/o fisici, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.PORT_OUT_VALORI = dati.transizioni
	.map(d => {
		// Se non ci sono uscite, defaulta a []
		if (!d.uscite) d.uscite = [];
		return d;
	})
	.map(get("uscite"))
	.map(d => Object.keys(d).filter(x => d[x] == "1"))
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.output))
	.toString();