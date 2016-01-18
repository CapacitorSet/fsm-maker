fsm-maker
=========

Transpiler JSON -> C per macchine a stati finiti.

# Esempi di utilizzo

`fsm.json` contiene la descrizione JSON di un semplice ascensore a tre piani. Il comando

    node make

transpila questa descrizione in codice C, adatto per esempio al caricamento su un microcontorllore.

# Overview

`fsm-maker` legge una stringa JSON, trasforma certi parametri in stringhe, sostituisce i relativi placeholder in `template.c` (ad esempio: `/*NUM_TRANSIZIONI*/` viene sostituito con il numero effettivo di transizioni), e scrive il risultato in `fsm.c`.

Il funzionamento viene descritto dettagliatamente in Relazione.md.