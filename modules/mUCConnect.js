/*
* oberstes ziel ist structur, modularisierung und flexibilitaet!
* - wir verwenden jQuery und jQueryUI
*/
const sControllerAddress = "https://uccontroller.ucconnect.de";
const sClientAppId = "/ws/client/createsession?clientappid=21";

var mUCSID;
var oUCServerVersion; // 70/61
var oDiscoverClient;
var oSession;
var oWebSocket;

function discover(sUCSID) {
/*
* siehe auch: https://wiki.estos.de/display/DEV/UCServer+Interface+Version
*/
	mUCSID = sUCSID;
	const sDiscoverClient = sControllerAddress + "/controller/client/ucws?ucsid=" + mUCSID;
	return fetch(sDiscoverClient, { dataType: "json" })
		.then(response => response.json())
		.then(data => oDiscoverClient = data);
}
function discoverVersion() {
	const sURL = sControllerAddress + "/ws/client/ucserverversion?ucsid=" + mUCSID;
	return fetch(sURL, { dataType: "json" })
		.then(response => response.json())
		.then(data => oUCServerVersion = data);
}
function loginBasicAuth(sUser, sPasswd) {
/*
* im UCConnect fall geht sowieso NUR "Basic" Authentication
* fuer localUCWeb sieht das schon anders aus
*/
	const sUrl = oDiscoverClient.redirect + sClientAppId, // "http://ws-ms.estos.de:7224/ws/client/createsession"
		oSettings = {
				method: "POST",
				contentType: "application/json",
				headers: {
					Authorization: "Basic " + btoa(sUser + ":" + sPasswd),
					"X-EPID": mUCSID,
					"X-UCSID": mUCSID
				},
				dataType: "json",
				body: JSON.stringify({ negotiate: { iClientProtocolVersion: oUCServerVersion.ucserverprotocolversion } }) // 61
			};

	return fetch(sUrl, oSettings)
		.then(response => response.json())
		.then(data => oSession = data);
}
function subscribe() {
	const urlSubscribe = oDiscoverClient.redirect + "/ws/client/asnChatSubscribeEvents",
		oBody = {
			bReceiveChatEvents: true,
			optionalParams: {
				bFilterAVJournalEvents: true }
			},
		oSSubscribe = {
			method: "POST",
			contentType: "application/json",
			headers: {
				"X-UCSID": mUCSID,
				"X-UCSESSIONID": oSession.sessionid
			},
			dataType: "json",
			body: JSON.stringify(oBody)
			};
	return fetch(urlSubscribe, oSSubscribe)
		.then(response => response.json());
}
function enterLoop(onMessage) {
	const _sURL = oDiscoverClient.redirect.replace("https://", "wss://"),
		sURL = _sURL.replace("http://", "ws://");

	oWebSocket = new WebSocket(sURL + "/ws/client/websocket?x-ucsessionid=" + oSession.sessionid);
	oWebSocket.onopen = function (evt) {
		console.log("wss::onOpen()");
		// subscribe();
	}
	oWebSocket.onMessage = onMessage;
}

export { discover, discoverVersion, loginBasicAuth, subscribe, enterLoop }; // 