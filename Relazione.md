Transpiler JSON &rarr; C per macchine a stati finiti
===

# Abstract

Questo documento ha l'obiettivo di descrivere il transpiler da JSON a C per macchine a stati "fsm-maker". Se ne descrive l'utilizzo e l'implementazione.

E' possibile scaricare il software da `https://github.com/CapacitorSet/fsm-maker/releases`.

# Glossario

**JSON**: Acronimo di *JavaScript Object Notation*, formato testuale per lo scambio di dati in forma di array e coppie chiave-valore.

**Coppia chiave-valore**: Associazione tra un campo (ad esempio `colore`) e il suo valore (`rosso`). In JSON si rappresenta come `"colore": "rosso"`.

**Transpiler**: Sinonimo di *source-to-source compiler*, un'applicazione che prende in input del codice sorgente in un linguaggio e produce il codice sorgente equivalente in un altro linguaggio.


# Utilizzo

In questa sezione, usiamo come esempio una macchina a stati per un semplice tornello a moneta (si allega il diagramma degli stati).

Possiamo iniziare definendo un nome e una descrizione:

    {
        "nome": "Tornello",
        "descrizione": "Un tornello a moneta."
    }

## Stati
Definiamo poi i nomi degli stati. Siccome si tratta di un array di valori, usiamo le parentesi quadre:
    
    {
        "nome": "Tornello",
        "descrizione": "Un tornello a moneta.",
        "stati": [
            "Aperto",
            "Chiuso"
        ]
    }

## Input
Facciamo poi la stessa cosa per gli input, che sono anch'essi un array.

    {
        "nome": "Tornello",
        "descrizione": "Un tornello a moneta.",
        "stati": [
            "Aperto",
            "Chiuso"
        ],
        "input": [
            "Bottone",
            "Moneta"
        ]
    }

## Valori iniziali
Se vogliamo definire dei valori iniziali, possiamo farlo con la chiave `iniziali`:

    {
        "nome": "Tornello",
        ...
        "iniziali": {
            "stato": "Chiuso",
            "input": []
        }
    }

**Nota**: la chiave `iniziali.input` esiste solo per motivi di debug (viene usata per simulare una singola transizione). In uno scenario reale, sarebbe inutilizzata.

La chiave `iniziali.input` è un array di input. Ad esempio, se vogliamo che la macchina inizi con il bottone premuto, usiamo `"input": ["Pulsante"]}`.

## Transizioni
La nostra FSM ha quattro transizioni:

* Da `Chiuso` a `Chiuso` se l'input `Pulsante` è alto;
* Da `Chiuso` ad `Aperto` se l'input `Moneta` è alto;
* Da `Aperto` ad `Aperto` se l'input `Moneta` è alto;
* Da `Aperto` a `Chiuso` se l'input `Pulsante` è alto;

In modo sistematico, possiamo descrivere le transizioni in questo modo:

* `{"da": "Chiuso", "a": "Chiuso", "condizioni": ["Pulsante"]}`
* `{"da": "Chiuso", "a": "Aperto", "condizioni": ["Moneta"]}`
* `{"da": "Aperto", "a": "Aperto", "condizioni": ["Moneta"]}`
* `{"da": "Aperto", "a": "Chiuso", "condizioni": ["Pulsante"]}`


**Nota**: la chiave `Condizioni` è un array. Per fare una transizione solo quando gli input "Finecorsa" e "Chiamata" sono attivi, ad esempio, scriveremmo `"condizioni": ["Finecorsa", "Chiamata"]}`.

**Nota*: per negare una condizione si usa `!` davanti al nome. Ad esempio, `"condizioni": ["!Fotocellula"]` significa "fai la transizione solo se l'input Fotocellula non è attivo".

Mettendo tutto insieme in forma di array, otteniamo:

    {
        "nome": "Tornello",
        ...
        "transizioni": [
          {"da": "Chiuso", "a": "Chiuso", "condizioni": ["Pulsante"]},
          {"da": "Chiuso", "a": "Aperto", "condizioni": ["Moneta"]},
          {"da": "Aperto", "a": "Aperto", "condizioni": ["Moneta"]},
          {"da": "Aperto", "a": "Chiuso", "condizioni": ["Pulsante"]}
        ]
    }


## Altro
Il programma ignora ogni chiave inaspettata. Questo può essere utile per inserire commenti:

    {
        "da": "Chiuso",
        "a": "Aperto",
        "condizioni": ["Moneta"],
        "commento": "Apri solo se metto una moneta"
    }

In JSON vengono ignorati gli spazi, le tabulazioni e gli a capo, permettendo di formattare le descrizioni con flessibilità come nell'esempio sopra.

## Codice completo
Si allega il listato di `fsm.json` per l'automa del tornello.

# Implementazione

## Livello 0: il programma in C

La struttura della macchina a stati è definita in `template.c`. Contiene:

 * un array di stati di partenza `state_t* da`;
 * un array di stati di arrivo `state_t* a`;
 * un array di condizioni da considerare (bitmask) `input_t* condizioni`;
 * un array di valori attesi per le condizioni `input_t* attesi`.

A ogni ciclo, vengono eseguite queste istruzioni:

```C
// per ciascuna transizione:
for (int i = 0; i < NUM_TRANSIZIONI; i++) {
    // se lo stato di partenza non corrisponde, passa alla prossima
    if (stato != partenza[i]) continue;
    // se consideriamo le condizioni necessarie (&), e il valore atteso (attesi) non corrisponde (!=), passa alla prossima
    if ((inputs & condizioni[i]) != attesi[i]) continue;
    // Altrimenti, stato e condizioni corrispondono: esegui la transizione e finisci il ciclo.
    stato = arrivo[i]; break;
}
```

E' importante osservare la riga 6: la prima operazione è un *bitmasking*, e la seconda è una disuguaglianza. Le bitmask permettono al codice di considerare solo alcuni bit.

>Ad esempio, se ci interessa che il bit di peso 0 sia alto e quello di peso 2 sia basso, iniziamo definendo la bitmask `0000 0101`:
>
>```
>Input   0010 0110 &
>Bitmask 0000 0101 =
>        ---------
>        0000 0100
>```
>
>Il byte risultante corrisponde a `inputs & condizioni[i]`. Arrivati a questo punto, il byte è nella forma `0000 0x0x`: **i bit che non ci interessano sono bassi**.
>
>Prendiamo poi questo byte, e verifichiamo che corrisponda al valore atteso (`xxxx x1x0` diventa `0000 0100`):
>
>```
>Intermedio 0000 0100 ==
>Atteso     0000 0100 =
>            ---------
>                 true
>```
>
>I due valori corrispondono: possiamo effettuare la transizione.

## Livello 1: le variabili in Javascript

La definizione human-friendly contenuta in `fsm.json` viene letta, e interpretata in JavaScript (in particolare, viene usato Node.js, con la libreria di default `json`). Il risultato è un oggetto JavaScript equivalente.

Consideriamo che in C la comparazione di stringhe è relativamente difficile: per comodità, associamo quindi un numero (un ID) a ogni stato. Questo viene fatto tramite un oggetto che mappi un nome di stato (la chiave) all'ID corrispodente (il valore):

```JavaScript
var IDStato,
    i = 0;
dati.stati.forEach(nome => IDStato[nome] = i++);
```

Arrivati a questo punto, costruiamo l'array di stati di partenza: di ogni transizione consideriamo lo stato di partenza, associamo il nome di stato al suo ID con un semplice `map`, e con `reduce` costruiamo una stringa.

```
var stringa_partenza = dati.transizioni
    .map(t => t.da) // Considera solo gli stati di partenza
    .map(s => IDStato[s]) // Ottieni l'ID di stato
    .reduce(
        (stringa, ID) => stringa + "\t" + ID + "\n",
        ""
    ); // Costruisci la stringa
```

Facciamo la stessa cosa per la stringa degli stati di arrivo.

Otteniamo poi le condizioni da considerare, in forma di bitmask. Questo è più complicato:

 * Innanzitutto, di ogni transizione consideriamo solo il `condizioni` con un `map`.

 * Togliamo poi un eventuale `!` iniziale.

 * Questo passo è importante: di ogni bit (`.map`) troviamo la posizione nella bit string di input (`bits.indexOf`), e ne otteniamo il peso. Sommiamo poi insieme tutti questi numeri con un semplice `reduce`.

    >```
    >.map(x => x.reduce(
    >    (n, d) => n + Math.pow(2, bits.indexOf(d)),
    >    0
    >))`

    >Dopo questo passaggio, ad esempio, l'input "Pulsante" diventa il numero `0` (perché è il bit di input numero 0), che diventa il numero 1 [= 2^0]. Viene poi sommato insieme alle altre eventuali condizioni.

 * Infine, formattiamo questo array trasformandolo in una stringa con `reduce`.

Calcolare i valori attesi corrisponde al passaggio sopra, ma il secondo passo è filtrare (`filter`, appunto) i valori che iniziano per `!`.

Una volta fatto questo, l'applicazione legge `template.c` e sostituisce `/*PARTENZA*/` con la stringa degli stati di partenza, `/*ARRIVO*/` con la stringa degli stati di arrivo e così via.

## Livello 2: la descrizione JSON

L'utente descrive una macchina a stati con un file JSON. Il formato è definito così:

 * Il file descrive un oggetto (`{}`).
 * La chiave `input` è un array di stringhe. Ciascuna stringa è il nome di un array. Il primo elemento dell'array corrisponde al primo bit di input, il secondo elemento al secondo bit e così via.
 * La chiave `stati` è un array di stringe. Ciascuna stringa è il nome di uno stato.
 * La chiave `iniziali` è un oggetto.
   * La chiave `iniziali.stato` è una stringa che indica lo stato iniziale.
   * La chiave `iniziali.input` è un array di stringhe corrispondenti agli input iniziali.
 * La chiave `transizioni` è un array. Ciascun elemento è un oggetto che descrive una transizione.
   * La chiave `transizioni[n].da` è una stringa che indica lo stato di partenza della transizione.
   * La chiave `transizioni[n].a` è una stringa che indica lo stato di arrivo della transizione.
   * La chiave `transizioni[n].condizioni` è un array di stringhe, corrispondenti alle condizioni necessarie perché la transizione sia eseguita. Se il primo carattere della stringa è `!`, la condizione corrispondente viene negata.