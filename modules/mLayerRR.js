/*
* dieser layer dient dazu:
*   die responses mit annonymen functionen zu behandeln.
* Ziele (Vorteile):
* - der handler steht direct beim request (erleichtert die lesbarkeit)
* - die argumente fuer den handler sind via closure erreichbar und muessen nicht in den request "hineincodiert" werden.
*   im vorgaengermodel war das die grosse schwachstelle. hier mussten alle CrossRefId's nochmal umgemappt werden.
* Nachteile:
* - das ist technisch (gemessen am codeumfang) und komplexitaet wesentlich aufwendiger.
* - mit diesem layer ist der client statusbehaftet.
* umfang und kompexitaet koennten sich als schwachstelle bzgl. resilence herausstellen.
*/
const mapRR = {};
const mapGather = {};
var oSocket;

function createInvokeID() {
	var sId = Math.random().toString().substr(2, 9);

	return parseInt(sId);
}
function createRequestID() {
	var sId = Math.random().toString(36).substr(2, 9);

	return "R" + sId;
}
function onMessage(oData) {
/*
* wir liefern einen ReturnWert true/false je nachdem ob:
* a.) die invokeID in der nsLayerRR.mapRR vorhanden war oder nicht
* b.) die u8sEventListCrossRefID in der nsLayerRR.mapGather vorhanden war oder nicht
* Achtung:
* - bei einem Segment mit mehreren Live-Event's laufen wir in ein problem
*/
	if ("undefined" !== typeof oData[0].result) {
		let oFrame = oData[0].result;
		// console.log("result for invokeID:", oFrame.invokeID);
		if("undefined" !== typeof nsLayerRR.mapRR[oFrame.invokeID]) {
			let oResult = oFrame.result;
			nsLayerRR.mapRR[oFrame.invokeID].fnCB(oResult.result);
			delete nsLayerRR.mapRR[oFrame.invokeID];
			return true;
		} else {
			console.info("unhandled request/response:", oFrame);
			return false;
		}
	}

	// events
	else if("undefined" !== typeof oData[0].invoke) {
		let oFrame = oData[0].invoke;
		if ("AsnChatEventArgument" == oFrame.argument._type) {
			// optimierung: keine ausstehenden requests
			if(0 === Object.keys(nsLayerRR.mapGather).length) return false;

			let oAsnChatEventArgument = oFrame.argument;
			if("undefined" !== typeof nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID]) {
/*
* task-psi: wir muessen hier evtl. nochmal value.u8sEventCrossRefID pruefen
* ich glaube im fehlerfall wird der
* value.u8sEventCrossRefID nach oAsnChatEventArgument.u8sEventListCrossRefID kopiert?
*/
				nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID].asnChatEventList = nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID].asnChatEventList.concat(oAsnChatEventArgument.asnChatEventList);
				if(oAsnChatEventArgument.bLastSegment) {
					nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID].fnCB(nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID].asnChatEventList);
					delete nsLayerRR.mapGather[oAsnChatEventArgument.u8sEventListCrossRefID];
				} else {
					// console.log("Segment Added to:", oAsnChatEventArgument.u8sEventListCrossRefID);
				}

				return true; // handle'd
			}

			else {
/*
* das, unglueckliche, special der: asnChatXXXMessage Operations ist dass:
* das ergebnis als AsnChatEventArgument zurueckgeliefert wird ABER
* die "correlationId" nicht in u8sEventListCrossRefID sondern in der u8sEventCrossRefID (pro element) steht!
* Fazit:
* JEDE Message, eines Live-Event muss geprueft werden ob sie nicht die response auf einen ausstehenden request ist!
* das ist a.) teuer und b.) wird hier die ausnahme zur regel.
* siehe auch: optimierung
*/
				let bHandled = false;
				oAsnChatEventArgument.asnChatEventList.forEach(function(value, nIndex) {
					if("string" === typeof value.u8sEventCrossRefID && "undefined" !== typeof nsLayerRR.mapGather[value.u8sEventCrossRefID]) {
						console.log("asnChatTextMessage/AsnChatEventArgument special:", value.u8sEventCrossRefID);
						// wenn ich das richtig verstanden habe kann das nur ein element enthalten. ggf. ruecksprache mit Rainer.Appel
						console.assert(oAsnChatEventArgument.bLastSegment, "oAsnChatEventArgument.bLastSegment");
						console.assert(1 === oAsnChatEventArgument.asnChatEventList.length, "1 === oAsnChatEventArgument.asnChatEventList.length");
						console.assert(0 === nsLayerRR.mapGather[value.u8sEventCrossRefID].asnChatEventList.length, "0 === nsLayerRR.mapGather[value.u8sEventCrossRefID].asnChatEventList.length"); // initialized as empty array, see layerRR.js(167)
						nsLayerRR.mapGather[value.u8sEventCrossRefID].fnCB(oAsnChatEventArgument.asnChatEventList);
						delete nsLayerRR.mapGather[value.u8sEventCrossRefID];
						bHandled = true;
					}
				});
				return bHandled;
			}
		}
	}
	return false;
}
function genericAJAX(sOperation, oArg, fnCB) {
/*
* diese funktion dient dazu einen call, AJAX like, auf einem WebSocket nachzubilden.
* konkret geht es darum das die Response nicht anhand einer Route transportiert
* wird sondern durch eine callback funktion behandelt wird.
* task-psi: wir verfeinern das noch mit einem promise! siehe: genericAJAXP()
*/
	var oFrame = {
			invoke: {
				invokeID: createInvokeID(), // das ist die "CrossRefId" (MagicId for diffUpdateGlobal) um die antwort einem request zuzuordnen
				operationName: "asn" + sOperation,
				argument: null
			}
		};

/*
* request patchen (auch diese Regel hat ausnahmen)
* es gibt Operationen die sich einen Argument type teilen.
* der Argument type kann also NICHT aus dem "operationName" abgeleitet werden!
* in diesem fall bitte eine dedizierte Function schreiben
*/
	oArg._type = "Asn" + sOperation + "Argument";

	// handle/notify some specials
	if("ChatSetMessagesStatus" === sOperation) {
		// mit: ChatSetMessagesStatus muss das argument vorhanden sein. das ist offensichtlich ein server fehler.
		if("string" !== typeof oArg.u8sEventCrossRefID)
			oArg.u8sEventCrossRefID = "";

		if(oArg.u8sEventCrossRefID.length)
			console.warn("use gatherChat() if you want to handle the result!");
	}

	mapRR[oFrame.invoke.invokeID] = { fnCB: fnCB };
	oFrame.invoke.argument = oArg;
	const sPayload = window.JSON.stringify(oFrame);
	oSocket.send(sPayload);
	console.log("mLayerRR::genericAJAX() SEND:", sOperation);
}
function genericAJAXP(sOperation, oArg) {
/*
* promisified version of genericAJAX()
*/
	var dRet = $.Deferred();

/*
* https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
* wir muessen den WebSocket zustand explizit abfragen daher ist die aktuelle umsetzung
* auf ein Deferred.fail() nur augenwischerei.
* Was bleibt ist der Vorteil das mehrere aufrufe in einer chain dann doch eine
* zentrale fehlerbehandlung erlauben.
*/
	if(winExt.oSocket.OPEN !== winExt.oSocket.readyState)
		return dRet.reject("WebSocket is already in CLOSING or CLOSED state.");

	nsLayerRR.genericAJAX(sOperation, oArg, function(oAsnResult) {
		dRet.resolve(oAsnResult);
	});
	return dRet;
}
function gatherChat(sOperation, oArg, fnCB) {
/*
* diese funktion dient dazu einen call, AJAX like, auf einem WebSocket nachzubilden.
* als spezialisierung zu: genericAJAX wird
* a.) das vom server segmentierte ergebniss zusammengesetzt bevor es durch den callback behandelt wird.
* b.) kann das gatherChat() nur mit Operations verwendet werden die eine asnChatEventList als ergebnis haben. 
*/
	var oFrame = {
			invoke: {
				invokeID: nsLayerRR.createInvokeID(), // das ist die "CrossRefId" (MagicId for diffUpdateGlobal) um die antwort einem request zuzuordnen
				operationName: "asn" + sOperation,
				argument: null
			}
		};

	// request patchen
	oArg._type = "Asn" + sOperation + "Argument";
	// nachdem wir dieses feld ueberschreiben warnen wir den caller
	winExt.assert("undefined" === typeof oArg.u8sEventCrossRefID, "undefined === typeof oArg.u8sEventCrossRefID");
	// mit: ChatSetMessagesStatus muss das argument vorhanden sein. das ist offensichtlich ein server fehler
	oArg.u8sEventCrossRefID = nsLayerRR.createRequestID();
/* unfall der betriebs geschichte (stehtiges dazulernen aber die fehler der vergangenheit nicht korrigieren)
* je nach request(operation) heisst das element fuer die request/response correlation
* mal u8sEventCrossRefID (AsnChatSetMessagesStatusArgument, ...) und
* mal u8sEventListCrossRefID (AsnChatGetEventsRangeArgument, ...)
* konsequent kann es also KEINE genericGather() funktion geben
* sondern es muss per hand (oder generiert) einen entsprechenden Stub geben.
*/
	winExt.assert("undefined" === typeof oArg.u8sEventListCrossRefID, "undefined === typeof oArg.u8sEventListCrossRefID");
	oArg.u8sEventListCrossRefID = oArg.u8sEventCrossRefID;

	nsLayerRR.mapGather[oArg.u8sEventCrossRefID] = { asnChatEventList: [], fnCB: fnCB };
	oFrame.invoke.argument = oArg;
	const sPayload = window.JSON.stringify(oFrame);
	winExt.oSocket.send(sPayload);
	console.log("nsLayerRR::gatherChat() Request:", sOperation, oFrame.invoke.invokeID, oArg.u8sEventCrossRefID);
}
function gatherChatP(sOperation, oArg) {
/*
* promisified version of gatherChat()
*/
	var dRet = $.Deferred();
	if(winExt.oSocket.OPEN !== winExt.oSocket.readyState)
		return dRet.reject("WebSocket is already in CLOSING or CLOSED state.");

	nsLayerRR.gatherChat(sOperation, oArg, function(asnChatEventList) {
		dRet.resolve(asnChatEventList);
	});
	return dRet;
}
function chatTextMessageBulk(sCrossRefID, sMessage) {
/*
* like chatTextMessage() with:
* - no additional gather(ChatGetEventsRange) afterwards
* - promisified
*/
	if(winExt.oSocket.OPEN !== winExt.oSocket.readyState)
		return dRet.reject("WebSocket is already in CLOSING or CLOSED state.");

	const oPayload = {
				u8sRecipientURIs: [winExt.oSession.ownContact.u8sContactId],
				u8sMessage: sMessage,
				u8sConversationID: g_sConversationID, // MUSS <Me> enthalten, beide parties OHNE sip:
				u8sEventCrossRefID: sCrossRefID,
				_type: "AsnChatTextMessageArgument"
			},
		oFrame = {
				invoke: {
					invokeID: nsLayerRR.createInvokeID(), // das ist die "CrossRefId" (MagicId for diffUpdateGlobal) um die antwort einem request zuzuordnen
					operationName: "asnChatTextMessage",
					argument: oPayload
				}
			},
		dRet = $.Deferred();

/*
* der nutzen dieser "Bulk" operations ist es, erst MEHRERE textMessages zu verschicken und den Feed erst
* nach dem versenden der letzten Message mit EINEM request abzuholen.
* wir verwerfen dieses ergebniss.
*/
		nsLayerRR.mapRR[oFrame.invoke.invokeID] = {
			fnCB: function(oAsnChatTextMessageResult) {
						console.info("remove/ignore, first, result from chatTextMessageBulk()", sCrossRefID);
						console.assert(!oAsnChatTextMessageResult.iResult, "!oAsnChatTextMessageResult.iResult");
					}
				};

/*
* mit dem dem ausloesen einer "Bulk" operation wird das zweite ergebnis, das Live-Event, als parameter fuer das resolve herangezogen.
* weiterhin MUESSESN wir dieses Live-Event explizit und gezielt an dieser stelle ENTSORGEN so das es NICHT zum anfordern eines LEOMISS kommt.
* Nicht nur das, dass bandbreite kostet und die ablaufTraces verhunzt es verhindert auch noch das wir requests von
* anderen client's/instancen (mit den selben credentials) erkennen koennen.
* Fazit: wir passen das hier ab und entsorgen es gezielt.
*/
	nsLayerRR.mapGather[oPayload.u8sEventCrossRefID] = { asnChatEventList: [], fnCB: function(asnChatEventList) {
				console.info("remove/ignore, second, result(LiveEvent) from chatTextMessageBulk()", sCrossRefID);
				dRet.resolve(asnChatEventList);
			}
		};

	const sPayload = window.JSON.stringify(oFrame);
	winExt.oSocket.send(sPayload);
	console.log("nsLayerRR::chatTextMessageBulk()", sCrossRefID);
	return dRet;
}
function chatTextMessage(sCrossRefID, sMessage, fnCB) {
/*
* das ist die erste von hand codierte special function weil wir:
* 1.) die u8sEventCrossRefID schon VOR dem aufruf brauchen
* 2.) KEIN interesse am ersten/zweiten ergebnis von asnChatTextMessage haben.
*/
	const oPayload = {
			u8sRecipientURIs: [winExt.oSession.ownContact.u8sContactId],
			u8sMessage: sMessage,
			u8sConversationID: g_sConversationID, // MUSS <Me> enthalten, beide parties OHNE sip:
			u8sEventCrossRefID: sCrossRefID,
			_type: "AsnChatTextMessageArgument"
		},
		oFrame = {
			invoke: {
				invokeID: nsLayerRR.createInvokeID(), // das ist die "CrossRefId" (MagicId for diffUpdateGlobal) um die antwort einem request zuzuordnen
				operationName: "asnChatTextMessage",
				argument: oPayload
			}
		};

/*
* siehe auch: nsEcho::Phase3, modelEcho.js(6)
* wir loesen mit dem akzeptieren der Message auf serverseite, dem AsnChatTextMessageResult ein getEventsRange() aus.
* dieser FEED kann dann nahtlos in unser nsChatMsg.rgDataModel eingearbeitet werden da er jetzt mit dem noetigen context angereichert ist.
* mit diesem vorgehen definieren wir die semantik des callback(fnCB) neu/anders.
* - das ergebnis aus asnChatGetEventsRange, ein AsnChatEventArgument mit environment/context
*/
	nsLayerRR.mapRR[oFrame.invoke.invokeID] = {
		fnCB: function(oAsnChatTextMessageResult) {
					console.log("nested getEventsRange() for:", oAsnChatTextMessageResult.iConvSequenceID, "from within: chatTextMessage()");
					console.assert(!oAsnChatTextMessageResult.iResult, "!oAsnChatTextMessageResult.iResult");
					nsLayerRR.gatherChat("ChatGetEventsRange",
						{
							iNumLessThanSeqID: g_nBlockSize,
							iNumGreaterThanOrEqualSeqID: g_nBlockSize,
							iSequenceID: oAsnChatTextMessageResult.iConvSequenceID,
							// u8sEventListCrossRefID: "ANYMISS9007199254740991", // NICHT verwenden wird von nsLayerRR UNBEDINGT ueberschieben
							asnConversationIDChoice: { u8sConversationID: oAsnChatTextMessageResult.u8sConversationID }
						}, fnCB);
				}
			};

/*
* mit dem ausloesen des getEventsRange() wird das zweite ergebnis, das Live-Event, aus asnChatTextMessage NICHT mehr gebraucht.
* um zu verhindern das dieses ergebnis als "Live-Event" amok laeuft und weitere aktionen triggert
* passen wir das hier ab indem wir es gezielt entsorgen.
*/
	nsLayerRR.mapGather[oPayload.u8sEventCrossRefID] = { asnChatEventList: [], fnCB: function(asnChatEventList) {
				console.info("remove/ignore, second, result from chatTextMessage()", sCrossRefID);
			}
		};

	const sPayload = window.JSON.stringify(oFrame);
	winExt.oSocket.send(sPayload);
	console.log("nsLayerRR::chatTextMessage()", sCrossRefID);
}
function chatBinaryMessage(sCrossRefID, sTransferId, sMessage, fnCB) {
/*
* das ist die zweite von hand codierte special function weil:
* - wir die u8sEventCrossRefID schon VOR dem aufruf brauchen
*/
	const oPayload = {
				u8sRecipientURIs: [winExt.oSession.ownContact.u8sContactId],
				u8sMessage: sMessage,
				u8sTransferID: sTransferId,
				u8sConversationID: g_sConversationID, // MUSS <Me> enthalten, beide parties OHNE sip:
				u8sEventCrossRefID: sCrossRefID,
				_type: "AsnChatBinaryMessageArgument"
			},
		oFrame = {
				invoke: {
					invokeID: nsLayerRR.createInvokeID(), // das ist die "CrossRefId" (MagicId for diffUpdateGlobal) um die antwort einem request zuzuordnen
					operationName: "asnChatBinaryMessage",
					argument: oPayload
				}
			};

/*
* siehe auch: nsEcho::Phase3, modelEcho.js(6)
* wir loesen mit dem akzeptieren der Message auf serverseite, dem AsnChatTextMessageResult ein getEventsRange() aus.
* dieser FEED kann dann nahtlos in unser nsChatMsg.rgDataModel eingearbeitet werden da er jetzt mit dem noetigen context angereichert ist.
* mit diesem vorgehen definieren wir die semantik des callback(fnCB) neu/anders.
* - das ergebnis aus asnChatGetEventsRange, ein AsnChatEventArgument mit environment/context
*/
	nsLayerRR.mapRR[oFrame.invoke.invokeID] = {
		fnCB: function(oAsnChatBinaryMessageResult) {
					console.log("nested getEventsRange() for:", oAsnChatBinaryMessageResult.iConvSequenceID, "from within: chatBinaryMessage()");
					console.assert(!oAsnChatBinaryMessageResult.iResult, "!oAsnChatBinaryMessageResult.iResult");
					nsLayerRR.gatherChat("ChatGetEventsRange",
						{
							iNumLessThanSeqID: 5,
							iNumGreaterThanOrEqualSeqID: 5,
							iSequenceID: oAsnChatBinaryMessageResult.iConvSequenceID,
							// u8sEventListCrossRefID: "ANYMISS9007199254740991", // NICHT verwenden wird von nsLayerRR UNBEDINGT ueberschieben
							asnConversationIDChoice: { u8sConversationID: oAsnChatBinaryMessageResult.u8sConversationID }
						}, fnCB);
				}
			};

/*
* mit dem ausloesen des getEventsRange() wird das zweite ergebnis, das Live-Event, aus asnChatTextMessage NICHT mehr gebraucht.
* um zu verhindern das dieses ergebnis als "Live-Event" amok laeuft und weitere aktionen triggert
* passen wir das hier ab indem wir es gezielt entsorgen.
*/
	nsLayerRR.mapGather[oPayload.u8sEventCrossRefID] = { asnChatEventList: [], fnCB: function(asnChatEventList) {
				console.info("remove/ignore, second, result from chatBinaryMessage()", sCrossRefID);
			}
		};

	const sPayload = window.JSON.stringify(oFrame);
	winExt.oSocket.send(sPayload);
	console.log("nsLayerRR::chatBinaryMessage()", sTransferId);
}

export {
	oSocket,
	genericAJAX,
	gatherChatP }; // 