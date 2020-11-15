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
				headers: {
					"Content-Type": "application/json",
					Authorization: "Basic " + btoa(sUser + ":" + sPasswd),
					"X-EPID": mUCSID,
					"X-UCSID": mUCSID
				},
				body: JSON.stringify({ negotiate: { iClientProtocolVersion: oUCServerVersion.ucserverprotocolversion } }) // 61
			};

	return fetch(sUrl, oSettings)
		.then(response => response.json())
		.then(data => oSession = data);
}
function loginTokenAuth(sToken) {
/*
* im UCConnect fall geht sowieso NUR "Basic" Authentication
* fuer localUCWeb sieht das schon anders aus
*/
	const sUrl = oDiscoverClient.redirect + sClientAppId, // "http://ws-ms.estos.de:7224/ws/client/createsession"
		oSettings = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "JWT " + sToken,
					"X-EPID": mUCSID,
					"X-UCSID": mUCSID
				},
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
			headers: {
				"Content-Type": "application/json",
				"X-UCSID": mUCSID,
				"X-UCSESSIONID": oSession.sessionid
			},
			body: JSON.stringify(oBody)
			};
	return fetch(urlSubscribe, oSSubscribe)
		.then(response => response.json());
}
function getDatabaseId() {
	const urlGetDatabaseId = oDiscoverClient.redirect + "/ws/client/asnChatGetDatabaseID",
		oGetDatabaseId = {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"X-UCSID": mUCSID,
					"X-UCSESSIONID": oSession.sessionid
				}
			};
	return fetch(urlGetDatabaseId, oGetDatabaseId)
		.then(response => response.json());
}
function getLoginToken() {
	const urlGetUserToken = oDiscoverClient.redirect + "/ws/client/asnGetUserToken",
		oBody = {
				iType: 1 // eUserTokenLogin(1), Token that allows Login To UCServer
			},
		oGetUserToken = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-UCSID": mUCSID,
				"X-UCSESSIONID": oSession.sessionid
			},
			body: JSON.stringify(oBody)
			};
	return fetch(urlGetUserToken, oGetUserToken)
		.then(response => response.json());
}
function refreshLoginToken(sKey) {
	return getLoginToken()
		.then(oUserToken => {
			const oUpdate = {
				ucsid: mUCSID,
				sToken: oUserToken.sToken
			};
			window.localStorage.setItem(sKey, JSON.stringify(oUpdate));
		});
}
function getDiffUpdate(sConversationId) {
	const urlGetDiffUpdate = oDiscoverClient.redirect + "/ws/client/asnChatGetDiffUpdate",
		oBody = {
				iMaxEvents: 15,
				u8sConversationID: sConversationId,
				iLastKnownGlobTransactionID: 0,
				u8sEventListCrossRefID: "mGetDiffUpdate"
			},
		oGetDiffUpdate = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-UCSID": mUCSID,
				"X-UCSESSIONID": oSession.sessionid
			},
			body: JSON.stringify(oBody)
			};
	return fetch(urlGetDiffUpdate, oGetDiffUpdate)
		.then(response => response.json());
}
function handleSegment(oArg) {
	if("AsnChatEventArgument" === oArg._type) {
		const rgChatEventList = oArg.asnChatEventList;
		console.log("length:", rgChatEventList.length, ", ListCrossRefID:", oArg.u8sEventListCrossRefID);
		console.log("0:", rgChatEventList[0]);
		if(oArg.bLastSegment) {
			console.log("bLastSegment!")
		}
		return true;
	} else
		console.log("unhandled Type:", oData[0].invoke.argument._type);
	return false;
}
function enterLoop(onMessage) {
	const _sURL = oDiscoverClient.redirect.replace("https://", "wss://"),
		sURL = _sURL.replace("http://", "ws://");

	oWebSocket = new WebSocket(sURL + "/ws/client/websocket?x-ucsessionid=" + oSession.sessionid);
	oWebSocket.onopen = function (evt) {
		console.log("wss::onOpen()");
	};
	oWebSocket.onmessage = onMessage;
}

export {
	discover,
	discoverVersion,
	loginBasicAuth,
	loginTokenAuth,
	subscribe,
	getLoginToken,
	refreshLoginToken,
	getDatabaseId,
	getDiffUpdate,
	handleSegment,
	enterLoop }; // 