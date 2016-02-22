stringa.HOOKS_ENABLED = 1*dati.transizioni.some(get("codice"));

if (stringa.HOOKS_ENABLED) {
	stringa.HOOKS = dati.transizioni
		.get("codice")
		.map(x => x || "nop")
		.toString();
}