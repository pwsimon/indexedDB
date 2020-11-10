/*
* oberstes ziel ist structur, modularisierung und flexibilitaet!
* - wir verwenden jQuery und jQueryUI
*/
const sControllerAddress = "https://uccontroller.ucconnect.de";
const sClientAppId = "/ws/client/createsession?clientappid=21";
const sUCSID = "estos.de";

var oUCServerVersion; // 70/61
var oDiscoverClient;

function discover() {
/*
* siehe auch: https://wiki.estos.de/display/DEV/UCServer+Interface+Version
*/
	const sDiscoverClient = sControllerAddress + "/controller/client/ucws?ucsid=" + sUCSID;
	return fetch(sDiscoverClient, { dataType: "json" })
		.then(response => response.json())
		.then(data => oDiscoverClient = data);
}

function discoverVersion() {
	const sURL = sControllerAddress + "/ws/client/ucserverversion?ucsid=" + sUCSID;
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
					"X-EPID": sUCSID,
					"X-UCSID": sUCSID
				},
				dataType: "json",
				body: JSON.stringify({ negotiate: { iClientProtocolVersion: oUCServerVersion.ucserverprotocolversion } }) // 61
			};

	return fetch(sUrl, oSettings)
		.then(response => response.json());
}

export { discover, discoverVersion, loginBasicAuth }; // 