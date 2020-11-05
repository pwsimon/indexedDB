/*
* Dieses Modul/Layer baut das estos Model, der getrennten channel fuer request/response,
* in das klassische schema request mit callback um/zurueck!
*
* Die estos API favorisiert per design getrennte channel fuer request/response.
* Ueber den request-channel wird ein synchroner request gesendet.
* Die respose wird asynchron dazu ueber den response-channel (WebSocket) empfangen.
*
* Allgemeines:
* Es gibt prinzipiel ZWEI Ursachen fuer eine aenderung der UI.
* 1.) automatissmen (aenderungen die von ANDEREN ausgeloest/verursacht werden)
*     z.B. neue nachricht, spezial: eine neue Nachricht von mir die aber von einer anderen instance getriggert wurde.
* 2.) Requests (aenderungen die von MIR ausgeloest/verursacht werden)
*     z.B. neue nachricht, Page-Up/Down, Delete, Suche, ...
*     Mit einem solchen request MUSS eine Anwendung/UI eine art von DIREKTEM feedback fuer den Benutzer liefern!
*     Das heisst der Benutzer muss unmittelbar den zusammenhang zwischen Ursache und Wirkung erkennen koennen.
*     Die UI aendert sich, es Piept, es Vibriert, ...
*
* drawbacks/specials/legacy:
* - auf .ASN1 ebene ist der request an sich synchron.
*   Eine synchrone API auf clientseite blockiert also bis der request serverseitig bearbeitet wurde.
*   Mit WebTechnologie (XMLHttpRequest) ist dieser drawback zu vernachlaessigen das hier eig. IMMER eine Async. API verwendet wird.
* - Mit dem synchronen request kann/gibt es schon teilergebnisse.
*   fuer den API Nutzer ist es aufwaendig/fehlertraechtig die synchronen und die asynchronen Teilergebnisse zusammenzufuehren.
* - es gibt im fall von KEIN ergebnis auch keinen trigger.
*   ein client muss also ggf. Timeout implementieren
* - Die ergebnismenge kann so gross sein das diese Segmentiert uebertragen werden muss.
*   ein client muss also diese segmente zusammenfuehren koennen.
*
* Die Aufgaben dieses Modules:
* Das design der Chat API ist ausschliesslich auf die anforderungen aus Punkt 1.) ausgerichtet.
* Die zusaetzlichen anforderungen aus Punkt 2.) lassen sich aufbauend auf Punkt 1.) realisieren.
* Die funktionalitaet dieses Modules ist also ausschliesslich, die anforderungen aus Punkt 2.)
* basierend auf den leistungen der API aus Punkt 1.) zu erbringen.
* - steuerung von subscribe/unsubscribe
* - erzeugen von korrellationsId's, vergabe mit request und zusammenfuehren mit response.
* - zusammenfuehren von segmenten.
*
* Hinweis:
* im Zuge von "Offline first" muss man eig. vollstaendig anders denken.
* Hier gibt es ausschliessllich aenderungen aus Punkt 2.) die sich IMMER OHNE Netzwerk ausfuehren lassen muessen.
* Irgendwann mal kommt es zur Netzwerkverbindung (und damit u.UI. auch zu Punkt 1.)
* Mit dem abgleichen der offline aktionen mit dem master werden weitere Ereignisse bzw. Konflikte generiert.
* Alle ereignisse hieraus sollen "silent" abgewickelt werden. Ist das nicht moeglich liegt ein Konflikt vor!
* Alle Konflikte werden in eine Liste aufgnommen und muessen vom Benutzer explizit in Aktionen uebersetzt werden.
* Wichtig: eine Aktion kann evtl. weiter hinten stehende Konflikte unnoetig machen (aufloesen).
*
* this module is designed to work with https://dexie.org/docs/Dexie/Dexie.backendDB()
*/
const storeName = "databaseId";

function getPreviousPage(db, pos) {
	return "promise";
}

export { storeName, getPreviousPage }; // 