var fs = require("fs"),
	template = fs.readFileSync("target/C/template.c", "utf8"),
	intermedio = JSON.parse(fs.readFileSync("fsm.json", "utf8"));

// Prendi le chiavi, sostituisci /*KEY*/ con value
var file = Object.keys(intermedio).reduce(
	(t, index) => t.replace("/*" + index + "*/", intermedio[index]),
	template
);

fs.writeFileSync("target/C/fsm.c", file);