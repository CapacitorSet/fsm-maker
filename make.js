var fs = require("fs"),
	dati = JSON.parse(fs.readFileSync("fsm.json", "utf8")),
	template = fs.readFileSync("template.c", "utf8");

dati.io = dati["i/o"]; // Piu' comodo da scrivere

if (!dati["input iniziali"])
	dati["input iniziali"] = [];

// Mappa ogni nome di stato a un numero incrementale
var IDStato = {},
	i = 0; // Contatore di stati
dati.macchine.forEach(macchina => macchina.stati.forEach(x => IDStato[x] = i++));

for (var IDMacchina in dati.macchine)
	dati.macchine[IDMacchina].id = IDMacchina;

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

Array.prototype.flatten = function() {
	return this.reduce(
		(x, d) => x.concat(d),
		[]
	);
};

var rimuoviEsclamativo = d => isNot(d) ? d.substr(1, d.length) : d;
var stringa = {};

// dati.transizioni è una variabile di comodo, contiene l'array flattenato delle transizioni di ciascuna fsm
dati.transizioni = dati.macchine.map(get("transizioni")).flatten();

stringa.HOOKS_ENABLED = 0; // to do

stringa.INPUT_INIZIALI = dati["input iniziali"].toBitmask(dati.io.input);

stringa.NUM_MACCHINE = dati.macchine.length;

stringa.FSM_ID = dati.macchine
	.map(d => d.transizioni.map(x => d.id))
	.flatten()
	.toString();

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
stringa.SOGLIA_BASSA = dati.antirimbalzo.schmitt.basso; // 0..255
stringa.SOGLIA_ALTA = dati.antirimbalzo.schmitt.alto; // 0..255
stringa.INTERVALLO = dati.antirimbalzo.schmitt.intervallo || 1; // Defaulta a 1

stringa.NUM_TRANSIZIONI = dati.transizioni.length;
stringa.NUM_INGRESSI = dati.io.input.length;

console.log(stringa);

console.log("Mappa stati:", IDStato);

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(stringa).reduce(
	(t, index) => t.replace("/*" + index + "*/", stringa[index]),
	template
);

fs.writeFileSync("fsm.c", file);