fs = require("fs");
template = fs.readFileSync("template.c", "utf8");
dati = JSON.parse(fs.readFileSync("fsm.json", "utf8"));

if (!dati["input iniziali"])
	dati["input iniziali"] = [];

stringa = {};

require("./util");
require("./hooks.js");

stringa.NUM_MACCHINE = dati.macchine.length;

stringa.FSM_ID = dati.macchine
	.map(d => d.transizioni.map(x => d.id))
	.flatten()
	.toString();

require("./stati");
require("./bus");
require("./port");
require("./antirimbalzo");

stringa.NUM_TRANSIZIONI = dati.transizioni.length;

console.log(stringa);

console.log("Mappa stati:", IDStato);

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(stringa).reduce(
	(t, index) => t.replace("/*" + index + "*/", stringa[index]),
	template
);

fs.writeFileSync("fsm.c", file);