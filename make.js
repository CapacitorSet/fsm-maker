var fs = require("fs"),
	dati = JSON.parse(fs.readFileSync("fsm.json", "utf8")),
	template = fs.readFileSync("template.c", "utf8");

// Mappa ogni nome di stato a un numero incrementale
var IDStato = {},
	i = 0;
dati.stati.forEach(x => IDStato[x] = i++);

console.log("Mappa stati:", IDStato);

var get = name => (d => d[name] || ""),
	getID = d => IDStato[d],
	toTabs = (str, d) => str + "\t" + d + ",\n",
	toBitmask = map => ((n, d) => n + (d ? Math.pow(2, map.indexOf(d)) : 0)),
	isNot = d => d.substr(0, 1) == "!";

Array.prototype.toBitmask = function(map) {
	return this.reduce(toBitmask(map), 0);
};

var replacement = {
	// Prendi i campi "da", trasformali in ID, tabulali
	PARTENZA: dati.transizioni
		.map(get("da"))
		.map(getID)
		.toString(),
	// Prendi i campi "a", trasformali in ID, tabulali
	ARRIVO: dati.transizioni
		.map(get("a"))
		.map(getID)
		.toString(),
	// Prendi i campi "condizioni", togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
	CONDIZIONI: dati.transizioni
		.map(get("condizioni"))
		.map(x => x.map(
			d => isNot(d) ? d.substr(1, d.length) : d
		))
		.map(d => d.toBitmask(dati.input))
		.toString(),
	// Prendi i campi "attesi", togli quelli che iniziano per !, trasforma in bitmask, tabula
	ATTESI: dati.transizioni
		.map(get("condizioni"))
		.map(x => x.filter(d => !isNot(d)))
		.map(d => d.toBitmask(dati.input))
		.toString(),

	NUM_TRANSIZIONI: dati.transizioni.length,
	// Prendi lo stato iniziale, ottienine l'ID
	STATO_INIZIALE: IDStato[dati.iniziali.stato],
	// Prendi gli input iniziali, rimuovi quelli che iniziano per !, trasformali in bitmask
	INPUTS_INIZIALI: dati.iniziali.input
		.filter(d => !isNot(d))
		.toBitmask(dati.input)
}

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(replacement).reduce(
	(t, index) => t.replace("/*" + index + "*/", replacement[index]),
	template
);

fs.writeFileSync("fsm.c", file);