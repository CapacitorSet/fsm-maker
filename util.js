IDStato = {};
var i = 0; // Contatore di stati

// Mappa ogni nome di stato a un numero incrementale
dati.macchine.forEach(macchina => macchina.stati.forEach(x => IDStato[x] = i++));

for (var IDMacchina in dati.macchine)
	dati.macchine[IDMacchina].id = IDMacchina;

dati.io = dati["i/o"]; // Piu' comodo da scrivere
// Funtore che restituisce una funzione che estrae il campo name dall'argomento
get = name => (d => d[name] || "");
// Ottiene l'ID di uno stato
getID = d => IDStato[d];
// Funtore che restituisce una funzione, che se usata con .reduce fa restituire una bitmask partendo da un array di ID di stato
toBitmask = map => ((n, d) => n + Math.pow(2, map.indexOf(d)));
// Indica se un i/o e' virtuale
isVirtual = d => dati.io.bus.indexOf(d) != -1;


// Trasforma un array in una bitmask
Array.prototype.toBitmask = function(map) {
	return this.reduce(toBitmask(map), 0);
};

// Filtra l'array rispetto a fn negato
Array.prototype.notFilter = function(fn) {
	return this.filter(x => !fn(x));
};

// Trasforma un array di array in un array
Array.prototype.flatten = function() {
	return this.reduce(
		(x, d) => x.concat(d),
		[]
	);
};

// dati.transizioni è una variabile di comodo, contiene l'array flattenato delle transizioni di ciascuna fsm
dati.transizioni = dati.macchine.map(get("transizioni")).flatten();