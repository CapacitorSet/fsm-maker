var fs = require("fs"),
	dati = JSON.parse(fs.readFileSync("fsm.json", "utf8")),
	template = fs.readFileSync("template.c", "utf8");

// Mappa ogni nome di stato a un numero incrementale
var IDStato = {},
	i = 0;
dati.stati.forEach(x => IDStato[x] = i++);

console.log("Mappa stati:", IDStato);

Array.prototype.get = function(name) {
	return this.map(d => d[name]);
};

Array.prototype.getID = function(name) {
	return this.map(d => IDStato);
};

Array.prototype.tabula = function() {
	return this.reduce(
		(str, d) => x + "\t" + d + ",\n",
		""
	);
};

Array.prototype.toBitmask = function() {
	return this.map(x => x.reduce(
		(n, d) => n + Math.pow(2, dati.input.indexOf(d)),
		0
	)) | "0";
};

var replacement = {
	// Prendi i campi "da", trasformali in ID, tabulali
	PARTENZA: dati.transizioni
		.get("da")
		.getID()
		.tabula(),
	// Prendi i campi "a", trasformali in ID, tabulali
	ARRIVO: dati.transizioni
		.get("a")
		.getID()
		.tabula(),
	// Prendi i campi "condizioni", togli l'eventuale ! iniziale di ogni input, trasformali in bitmask, tabula
	CONDIZIONI: dati.transizioni
		.get("condizioni")
		.map(x => x.map(
			d => d.substr(0, 1) == "!" ? d.substr(1, d.length) : d
		))
		.toBitmask()
		.tabula(),
	// Prendi i campi "attesi", togli quelli che iniziano per !, trasforma in bitmask, tabula
	ATTESI: dati.transizioni
		.get("attesi")
		.map(x => x.filter(d => d.substr(0, 1) != "!"))
		.toBitmask()
		.tabula(),

	NUM_TRANSIZIONI: dati.transizioni.length,
	// Prendi lo stato iniziale, ottienine l'ID
	STATO_INIZIALE: IDStato[dati.iniziali.stato],
	// Prendi gli input iniziali, rimuovi quelli che iniziano per !, trasformali in bitmask
	INPUTS_INIZIALI: dati.iniziali.input
		.filter(d => d.substr(0, 1) != "!")
		.toBitmask()[0]
}

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(replacement).reduce(
	(t, index) => t.replace("/*" + index + "*/", replacement[index]),
	template
);

fs.writeFileSync("fsm.c", file);