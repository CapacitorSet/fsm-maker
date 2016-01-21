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

## Introduzione
`fsm-maker` modella l'automa come **un insieme di macchine a stati in parallelo**, che hanno accesso alle porte di I/O ed eventualmente a una **memoria condivisa (bus)**.

Le singole macchine a stati sono **macchine di Mealy** (gli output sono associati alle transizioni, non agli stati).

In un primo momento definiamo le caratteristiche dell'automa; descriviamo poi le caratteristiche delle singole macchine di Mealy.

## Definizione dell'automa
Come prima cosa, descriviamo le caratteristiche *generali* dell'automa.

### Nome, descrizione
Iniziamo definendo il nome e la descrizione dell'automa.
```JSON
{
    "nome": "Tornello",
    "descrizione": "Un tornello a moneta."
}
```

### I/O (input/output)

Definiamo poi le entrate e le uscite dell'automa.

* Individuiamo gli input *fisici*, e scriviamoli nel campo `"i/o".input`.
>Il tornello ha due input fisici: la moneta e il pulsante. Quindi possiamo scrivere:
>```JSON
>{
>    "nome": "Tornello",
>    "descrizione": "Un tornello a moneta.",
>    "i/o": {
>        "input": ["Moneta", "Pulsante"]
>    }
>}
>```

* Facciamo la stessa cosa con gli output *fisici*, nel campo `"i/o".output`.
>Ipotizziamo che il tornello abbia due output fisici: un segnale blocca il meccanismo (chiamiamolo `SegnaleBlocca`), e un altro lo apre (chiamiamolo `SegnaleApri`). Allora scriviamo:
>```JSON
>{
>    ...
>    "i/o": {
>        "input": ["Moneta", "Pulsante"],
>        "output": ["SegnaleBlocca", "SegnaleApri"]
>    }
>}
>```

* In generale, un automa può comprendere diverse macchine a stati, che hanno bisogno di una memoria condivisa (le uscite di una sono ingressi dell'altra). Specifichiamo le variabili condivise in `"i/o".bus`.
>Ad esempio, il nostro tornello potrebbe contenere un automa che gestisce l'apertura e la chiusura, e un automa contatore, che conta quante volte si apre il cancello. In quel caso, potremmo definire una variabile condivisa `Incrementa`: quando il tornello si apre, questo bit va alto per un ciclo, il contatore legge questo bit e incrementa il conteggio. In quel caso, scriveremmo:
>```JSON
>{
>    ...
>    "i/o": {
>        "input": ["Moneta", "Pulsante"],
>        "output": ["SegnaleBlocca", "SegnaleApri"],
>        "bus": ["Incrementa"]
>    }
>}
>```

 **Se l'automa contiene solo una macchina a stati, non c'è bisogno di definire** `"i/o".bus`**.**

#### Input iniziali
Se si vuole testare l'automa prima di caricarlo su un microcontrollore, può essere utile definire la situazione iniziale degli input. E' possibile farlo tramite `"input iniziali"`.

>Ad esempio, se vogliamo simulare che è già stata inserita una moneta (e quindi che l'input `Moneta` inizialmente è alto), scriviamo:
>```JSON
>{
>    ...
>    "i/o": { ... },
>    "input iniziali": ["Moneta"]
>}
>```

#### Antirimbalzo
Probabilmente, alcuni input sono soggetti a rimbalzo. Se vogliamo attivare la funzionalità antirimbalzo, usiamo il campo `antirimbalzo`.

L'antirimbalzo si basa su un contatore relativo a ciascun input. Se l'input è alto, il conteggio incrementa di 1 (fino a 255); se l'input è basso, il conteggio diminuisce di 1 (fino a 0). Questo controllo viene fatto ogni `antirimbalzo.intervallo` cicli.

>Il valore `1` corrisponde a un controllo ogni ciclo, `2` a un controllo ogni due cicli (una volta sì, una volta no) e così via.

Questo contatore viene poi letto da un trigger di Schmitt, le cui soglie sono definite da `antirimbalzo.schmitt.alto` e `antirimbalzo.schmitt.basso`.

Le porte su cui viene attivata questa funzionalità sono definite in `antirimbalzo.porte`.

>Ad esempio, nel tornello vogliamo attivare l'antirimbalzo solo sull'input `Pulsante`. Scegliamo, arbitrariamente, che il controllo venga fatto ogni ciclo (`antirimbalzo.intervallo = 1`), e che la soglia alta e la soglia bassa siano rispettivamente `250` e `30`:
>```JSON
>{
>    "nome": "Tornello",
>    ...
>    "antirimbalzo": {
>        "intervallo": 1,
>        "schmitt": {
>            "alto": 250,
>            "basso": 30
>        },
>        "porte": ["Pulsante"]
>    }
>}
>```

## Macchine
Le macchine sono definite in `macchine`.

>Quindi, il file avrà questo aspetto:
>```JSON
>{
>    "nome": "Tornello",
>    "i/o": {...},
>    ...
>    "macchine": [
>        {
>            "nome": "Prima macchina",
>            ...
>        }, {
>            "nome": "Seconda macchina",
>            ...
>        }
>    ]
>}
>```

&nbsp;
>Nell'esempio del tornello, ci basta definire una sola macchina a stati.

### Stati
Iniziamo definendo i nomi degli stati di ciascuna macchina in `.stati`.

>Per il tornello, abbiamo lo stato aperto e lo stato chiuso:
>```JSON
>{
>    "nome": "Tornello",
>    ...
>    "macchine": [
>        {
>            "stati": [
>                "Aperto",
>                "Chiuso"
>            ]
>        }
>    ]
>}
>```   

&nbsp;
>Per brevità, d'ora in poi ci limiteremo a mostrare la descrizione di una singola macchina, ad esempio:
>```JSON
>{
>    "stati": [
>        "Aperto",
>        "Chiuso"
>    ]
>}
>```

#### Stato iniziale
Definiamo lo stato iniziale della macchina in `"stato iniziale"`.

>Se vogliamo che inizialmente il tornello sia nello stato `Chiuso`:
>```JSON
>    {
>        "stati": [
>            "Aperto",
>            "Chiuso"
>        ],
>   "stato iniziale": "Chiuso"
>    }
>```

### Transizioni
Finalmente, definiamo l'elemento più importante, le transizioni della macchina a stati.

>La macchina a stati del tornello ha quattro transizioni:

>* Da `Chiuso` a `Chiuso` se l'input `Pulsante` è alto;
>* Da `Chiuso` ad `Aperto`, mettendo alto l'output `SegnaleApri`, se l'input `Moneta` è alto;
>* Da `Aperto` ad `Aperto` se l'input `Moneta` è alto;
>* Da `Aperto` a `Chiuso`, mettendo alto l'output `SegnaleBlocca`, se l'input `Pulsante` è alto.

>In modo sistematico, possiamo descrivere le transizioni in questo modo:

>* `{"da": "Chiuso", "a": "Chiuso", "condizioni": ["Pulsante"]}`
>* `{"da": "Chiuso", "a": "Aperto", "condizioni": ["Moneta"], "uscite": "SegnaleApri"}`
>* `{"da": "Aperto", "a": "Aperto", "condizioni": ["Moneta"]}`
>* `{"da": "Aperto", "a": "Chiuso", "condizioni": ["Pulsante"], "uscite": "SegnaleBlocca"}`


**Nota**: per negare una condizione si usa `!` davanti al nome. Ad esempio, `"condizioni": ["!Fotocellula"]` significa "fai la transizione solo se l'input Fotocellula non è attivo".

>Mettendo tutto insieme in forma di array, otteniamo:
>```JSON
{
    "stati": ["Aperto", "Chiuso"],
    "stato iniziale": "Chiuso",
    "transizioni": [
      {
          "da": "Chiuso",
          "a": "Chiuso",
          "condizioni": ["Pulsante"]
      },
      {
          "da": "Chiuso",
          "a": "Aperto",
          "condizioni": ["Moneta"],
          "uscite": ["SegnaleApri"]
      },
      {
          "da": "Aperto",
          "a": "Aperto",
          "condizioni": ["Moneta"]
      },
      {
          "da": "Aperto",
          "a": "Chiuso",
          "condizioni": ["Pulsante"],
          "uscite": ["SegnaleChiudi"]
      }
    ]
}
>```

#### Hook
Se è necessario chiamare del codice C personalizzato, è possibile farlo tramite `hooks`, che contiene un nome di funzione. Questa funzione viene definita in `hooks.c` così:

* se i bus sono abilitati, con il prototipo
```C
void funzione(const io_t inputs, io_t outputs, const io_t bus, io_t new_bus)
```
* se i bus non sono abilitati (cioè se non è stata definita nessuna variabile in `"i/o".bus`, con il prototipo
```C
void funzione(const io_t inputs, io_t outputs)
```
>`io_t` corrisponde a `uint32_t`, cioè a 32 bit.
>Per leggere dal bus, si usa la variabile `const io_t bus`; per scrivere sul bus, si usa `io_t new_bus`.

&nbsp;
>Ad esempio, mettiamo di voler stampare la stringa *Hello world!* quando il tornello si apre.
>Come prima cosa, scriviamo la funzione `hello`, usando il prototipo corretto (`void funzione(const io_t inputs, io_t outputs)`:
>```C
>void hello(const io_t inputs, io_t outputs) {
>    printf("Hello world!\n");
>}
>```
>Poi, copiamo questa funzione in `hooks.c`.
>Fatto questo, modifichiamo il file che definisce l'automa, e cambiamo la riga
>```JSON
>...
>{
          "da": "Chiuso",
          "a": "Aperto",
          "condizioni": ["Moneta"],
          "uscite": ["SegnaleApri"]
>}
>...
>```
>in
>```JSON
{
    "da": "Chiuso",
    "a": "Aperto",
    "condizioni": ["Moneta"],
    "uscite": ["SegnaleApri"],
    "codice": "hello"
}
>```
## Codice completo
Si allega il listato di `fsm.json` per l'automa del tornello.

# Implementazione

## Livello 0: il programma in C

### Struttura

La struttura della macchina a stati è definita in `template.c`. Contiene come minimo:

 * un array di stati di partenza `state_t da[]`;
 * un array di stati di arrivo `state_t a[]`;
 * un array di condizioni da considerare (bitmask) per le porte di ingresso reali `io_t port_in_bitmask[]`;
 * un array di valori attesi per le condizioni per le porte di ingresso reali `io_t port_in_valori[]`;
 * un array di bit da modificare (bitmask) per le porte di uscita reali `io_t port_out_bitmask[]`;
 * un array di valori attesi per le condizioni per le porte di ingresso reali `io_t port_out_valori[]`.

Se è definito anche un bus, vengono definiti anche `io_t bus_in_bitmask[]`, `io_t bus_in_valori[]` e così via.

A ogni ciclo, vengono eseguite queste istruzioni:

```
Esegui l'eventuale antirimbalzo.
Per ciascuna macchina:
    Per ciascuna transizione:
        Se lo stato di partenza non corrisponde, passa alla prossima.
        Della porta di input, considera solo le condizioni necessarie. Se il valore non corrisponde a quello atteso, passa alla prossima.
        Se sono abilitati i bus:
            Del bus, considera solo le condizioni necessarie. Se il valore non corrisponde a quello atteso, passa alla prossima.
        // Arrivati a questo punto, stato e condizioni corrispondono: esegui la transizione.
        Stato attuale = arrivo[i]
        Se sono abilitati i bus:
            Scrivi il valore finale nel buffer del bus
    Flusha il buffer del bus, nel bus.
```

L'operazione "considera solo le condizioni necessarie" viene effettuata con il *bitmasking*. Le bitmask permettono al codice di considerare solo alcuni bit.

>Ad esempio, se ci interessa che il bit di peso 0 sia alto e quello di peso 2 sia basso, iniziamo definendo la bitmask `0000 0101`:
>
>```
>Input   0010 0110 &
>Bitmask 0000 0101 =
>         ---------
>         0000 0100
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

### Antirimbalzo
L'antirimbalzo viene implementato con un semplice byte di conteggio, associato a ciascun ingresso. Quando l'ingresso è alto, il contatore viene incrementato; quando è basso, il contatore viene decrementato. Viene poi applicata una funzione di isteresi (corrispondente a un trigger di Schmitt).

Si può scegliere che l'operazione venga fatta solo una volta ogni N cicli: in quel caso, si usa un byte che viene incrementato a ogni ciclo, e si controlla che il byte modulo N sia uguale a 0.

```C
cicli++;
cicli %= N;
if (cicli == 0) {
    // Per ogni input
        if (input) conteggio++;
        else       conteggio--;

       if (input_pulito == 1 && conteggio < soglia_bassa)
           input_pulito = 0;
       else if (input_pulito == 0 && conteggio > soglia_alta)
           input_pulito = 1;
}
```

### Nota: il preprocessore
`fsm-maker` supporta diverse funzionalità, come la gestione di più macchine o l'antirimbalzo.

Tuttavia, non sempre queste sono richieste: ad esempio, un automa molto semplice potrebbe consistere di una sola macchina. In quel caso, per motivi di performance il codice viene "semplificato", rimuovendo le strutture dati necessarie a supportare le macchine multiple: questo viene fatto tramite le direttive per il preprocessore.
Quando il codice viene transpilato in C, vengono create delle linee come `#define SUPPORTA_MACCHINE_MULTIPLE 0`; in seguito, all'interno del loop si usa le direttive `#if` in questo modo:
```C
int IDMacchina = 0;
#if SUPPORTA_MACCHINE_MULTIPLE
    for (; IDMacchina < NUMERO_MACCHINE; IDMacchina++) {
#else
    {
#endif
```

Osserviamo che se la variabile del preprocessore `SUPPORTA_MACCHINE_MULTIPLE` è disattivata, il codice viene semplificato, rimuovendo la struttura `for`.

## Livello 1: le variabili in Javascript

La definizione human-friendly contenuta in `fsm.json` viene letta, e interpretata in JavaScript (in particolare, viene usato Node.js, con la libreria di default `json`). Il risultato è un oggetto JavaScript equivalente.

Il codice di `make.js` è complesso, ma sostanzialmente crea diversi array di lunghezza identica, dove l'n-esimo elemento contiene le informazioni per l'n-esima transizione, in particolare:

* La macchina a stati a cui si riferisce;
* Lo stato di partenza e di arrivo;
* Le bitmask delle porte di ingresso, e i relativi valori attesi;
* Le bitmask delle porte di uscita, e i relativi valori da scrivere;
* Le bitmask di ingresso del bus, e i relativi valori attesi;
* Le bitmask di uscita del bus, e i relativi valori da scrivere;
* L'eventuale hook in C.

Questi array vengono poi inseriti in `fsm.c`, sostituendone i placeholder.

Vengono poi compilati altri dati, tra cui gli stati iniziali delle macchine e i dati del controllo antirimbalzo.

## Livello 2: la descrizione JSON

L'utente descrive una macchina a stati con un file JSON. Il formato è definito così:

* Il file descrive un oggetto (`{}`).
* La chiave `i/o` è un oggetto.
     * La chiave `i/o.input` è un array di stringhe. Ciascuna stringa è il nome di un input. Il primo elemento dell'array corrisponde al primo bit di input, il secondo elemento al secondo bit e così via.
     * Stessa cosa per `i/o.output`.
     * Stessa cosa per `i/o.bus`.
* La chiave `"input iniziali"` è un array di stringhe. Ciascuna stringa è il nome di un input.
* La chiave `antirimbalzo` è un oggetto.
    * La chiave `antirimbalzo.intervallo` è un numero che specifica ogni quanto effettuare il controllo antirimbalzo (lettura, memorizzazione, isteresi, aggiornamento).
    * La chiave `antirimbalzo.schmitt` è un oggetto.
        * La chiave `antirimbalzo.schmitt.basso` è la soglia bassa del trigger di Schmitt.
        * `.alto` è la soglia alta.
    * La chiave `antirimbalzo.porte` è un array di stringhe. Ogni stringa è il nome di un input.
* La chiave `macchine` è un array di oggetti, ciascuno dei quali descrive una macchina a stati. Di ciascun oggetto:
    * La chiave `stati` è un array di stringhe, ciascuna corrispondente a uno stato possibile per la macchina.
    * La chiave `"stato iniziale"` è una stringa, corrispondente al nome dello stato iniziale.
    * La chiave `transizioni` è un array di oggetti, ciascuno corrispondente a una transizione. Di ciascun oggetto:
        * La chiave `da` è una stringa con il nome dello stato iniziale.
        * La chiave `a` è una stringa con il nome dello stato finale.
        * La chiave `condizioni` è un array di stringhe, ciascuna corrispondente al nome di un input. Se la condizione dev'essere negata, la stringa inizia per `!`.
        * La chiave `codice` è opzionale, ed è una stringa con il nome della funzione da chiamare quando viene eseguita la transizione.
