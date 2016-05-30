fs = require("fs");
dati = require("js-yaml").load(fs.readFileSync("fsm.yaml", "utf8"));

dati.io = dati["i/o"]; // Piu' comodo da scrivere

if (!dati["input iniziali"])
	dati["input iniziali"] = [];

stringa = {};

require("./librerie/util");
require("./librerie/hooks");

stringa.NUM_MACCHINE = dati.macchine.length;

stringa.FSM_ID = dati.macchine
	.map(d => d.transizioni.map(x => d.id))
	.flatten()
	.toString();

require("./librerie/stati");
require("./librerie/bus");
require("./librerie/port");
require("./librerie/antirimbalzo");

stringa.NUM_TRANSIZIONI = dati.transizioni.length;

console.log(stringa);

console.log("Mappa stati:", IDStato);

fs.writeFileSync("fsm.json", JSON.stringify(stringa));