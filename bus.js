stringa.BUS_ENABLED = Number(dati.io.bus.length != 0);

if (stringa.BUS_ENABLED) {

// Prendi i campi "condizioni", considera solo gli i/o virtuali, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.BUS_IN_BITMASK = dati.transizioni
	.map(get("condizioni"))
	.map(x => x.map(rimuoviEsclamativo))
	.map(a => a.filter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();
// Prendi i campi "condizioni", considera solo gli i/o virtuali, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.BUS_IN_VALORI = dati.transizioni
	.map(get("condizioni"))
	.map(d => d.notFilter(isNot))
	.map(a => a.filter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();

// Prendi i campi "uscite", considera solo gli i/o virtuali, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.BUS_OUT_BITMASK = dati.transizioni
	.map(d => {
		// Se non ci sono uscite, defaulta a []
		if (!d.uscite) d.uscite = [];
		return d;
	})
	.map(get("uscite"))
	.map(x => x.map(rimuoviEsclamativo))
	.map(a => a.filter(isVirtual))
	.map(d => d.toBitmask(dati.io.output))
	.toString();
// Prendi i campi "uscite", considera solo gli i/o virtuali, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.BUS_OUT_VALORI = dati.transizioni
	.map(d => {
		// Se non ci sono uscite, defaulta a []
		if (!d.uscite) d.uscite = [];
		return d;
	})
	.map(get("uscite"))
	.map(d => d.notFilter(isNot))
	.map(a => a.filter(isVirtual))
	.map(d => d.toBitmask(dati.io.output))
	.toString();

}