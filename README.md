fsm-maker
===

Un transpiler YAML → JSON → C per macchine a stati finiti.

# Esempi di utilizzo

`fsm.yaml` contiene la descrizione YAML di un semplice ascensore a tre piani. Il comando

    node make

crea una rappresentazione intermedia in JSON, e il comando

    node target/C/compile

compila la rappresentazione intermedia in codice C, adatto per esempio al caricamento su un microcontrollore. Il file di output si trova in `target/C/fsm.c`

# Overview

`fsm-maker` legge una stringa YAML, trasforma i parametri da stringhe a formati personalizzati, e scrive questa rappresentazione intermedia in `fsm.json`.

Poi, il compilatore di target legge questa rappresentazione, sostituisce i relativi placeholder in `template.c` (ad esempio: `/*NUM_TRANSIZIONI*/` viene sostituito con il numero effettivo di transizioni), e scrive il risultato in `fsm.c`.

Il funzionamento viene descritto dettagliatamente in Relazione.md.