var fs = require("fs"),
	dati = JSON.parse(fs.readFileSync("fsm.json", "utf8")),
	template = fs.readFileSync("template.c", "utf8");

if (dati.tipo != "mealy") {
	console.log('Devi specificare il tipo di FSM "mealy".');
	return;
}

dati.io = dati["i/o"]; // Piu' comodo da scrivere

// Mappa ogni nome di stato a un numero incrementale
var IDStato = {},
	i = 0;
dati.stati.forEach(x => IDStato[x] = i++);

console.log("Mappa stati:", IDStato);

// Funtore che restituisce una funzione che estrae il campo name dall'argomento
get = name => (d => d[name] || "");
// Ottiene l'ID di uno stato
getID = d => IDStato[d];
// Funtore che restituisce una funzione, che se usata con .reduce fa restituire una bitmask partendo da un array di ID di stato
toBitmask = map => ((n, d) => n + Math.pow(2, map.indexOf(d)));
// Indica se un nome di stato inizia per !
isNot = d => d.substr(0, 1) == "!";
// Indica se un i/o e' virtuale
isVirtual = d => dati.io.bus.indexOf(d) != -1;

// Trasforma un array in una bitmask
Array.prototype.toBitmask = function(map) {
	return this.reduce(toBitmask(map), 0);
};

Array.prototype.notFilter = function(fn) {
	return this.filter(x => !fn(x));
};

var rimuoviEsclamativo = d => isNot(d) ? d.substr(1, d.length) : d;
var stringa = {};

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

// Prendi i campi "condizioni", considera solo gli i/o fisici, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.PORT_IN_BITMASK = dati.transizioni
	.map(get("condizioni"))
	.map(x => x.map(rimuoviEsclamativo))
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();
// Prendi i campi "condizioni", considera solo gli i/o virtuali, togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
stringa.BUS_IN_BITMASK = dati.transizioni
	.map(get("condizioni"))
	.map(x => x.map(rimuoviEsclamativo))
	.map(a => a.filter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();

// Prendi i campi "condizioni", considera solo gli i/o fisici, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.PORT_IN_VALORI = dati.transizioni
	.map(get("condizioni"))
	.map(d => d.notFilter(isNot))
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.input))
	.toString();
// Prendi i campi "condizioni", considera solo gli i/o virtuali, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.BUS_IN_VALORI = dati.transizioni
	.map(get("condizioni"))
	.map(d => d.notFilter(isNot))
	.map(a => a.filter(isVirtual))
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
	.map(x => x.map(rimuoviEsclamativo))
	.map(a => a.notFilter(isVirtual))
	.map(d => d.toBitmask(dati.io.output))
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

// Prendi i campi "uscite", considera solo gli i/o fisici, togli gli input che iniziano per !, trasformali in bitmask, tabula
stringa.PORT_OUT_VALORI = dati.transizioni
	.map(d => {
		// Se non ci sono uscite, defaulta a []
		if (!d.uscite) d.uscite = [];
		return d;
	})
	.map(get("uscite"))
	.map(d => d.notFilter(isNot))
	.map(a => a.notFilter(isVirtual))
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

stringa.BUS_ENABLED = Number(dati.io.bus.length != 0);
stringa.DEBOUNCE_ENABLED = Number(dati.antirimbalzo.porte.length != 0);

i = 1;
stringa.INPUT_COUNTS = dati.io.input.map(x => 127).toString();
stringa.INGRESSI_DEBOUNCED = dati.io.input
	.map(x => dati.antirimbalzo.porte.indexOf(x) != -1)
	.map(Number)
	.toString();
stringa.COSTANTE_PER_RC = dati.antirimbalzo.esponente;
stringa.SOGLIA_BASSA = dati.antirimbalzo.schmitt.basso; // 0..255
stringa.SOGLIA_ALTA = dati.antirimbalzo.schmitt.alto; // 0..255
stringa.INTERVALLO = dati.antirimbalzo.schmitt.intervallo || 1; // Defaulta a 1

stringa.NUM_TRANSIZIONI = dati.transizioni.length;
stringa.NUM_INGRESSI = dati.io.input.length;

// Prendi lo stato iniziale, ottienine l'ID
stringa.STATO_INIZIALE = IDStato[dati.iniziali.stato];
// Prendi gli input iniziali, rimuovi quelli che iniziano per !, trasformali in bitmask
stringa.INPUTS_INIZIALI = dati.iniziali.input
	.filter(d => !isNot(d))
	.toBitmask(dati.io.input);

console.log(stringa);

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(stringa).reduce(
	(t, index) => t.replace("/*" + index + "*/", stringa[index]),
	template
);

fs.writeFileSync("fsm.c", file);