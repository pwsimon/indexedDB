import * as eChat from './modules/mChat.js';

// predefined demo data to create stores
const g_rgChat = [
		{
			u8sConversationID: "psi@estos.de;pws@estos.de",
			iConvSequenceID: 1,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:00:00.000Z", // date.toISOString()
			asnChatMessage: {
					u8sMessage: "hurts"
				},
			u8sEventCrossRefID: "jBnFffRDPlOKh"
		},
		{
			u8sConversationID: "psi@estos.de;pws@estos.de",
			iConvSequenceID: 2,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:01:00.000Z",
			asnChatMessage: {
					u8sMessage: "wurts"
				}
		},
	];
const g_schema = "u8sEventCrossRefID, iConvSequenceID";
const g_stores = {
		Cpsi_pws: g_schema,
		Ceb_psi: g_schema
	};
const g_rgConversation = [
		{
			iConvSequenceID: 1,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:00:00.000Z", // date.toISOString()
			asnChatMessage: {
					u8sMessage: "hurts"
				},
			u8sEventCrossRefID: "jBnFffRDPlOKh"
		},
		{
			iConvSequenceID: 2,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:01:00.000Z",
			asnChatMessage: {
					u8sMessage: "wurts"
				}
			// u8sEventCrossRefID: "jBnFffRDPlOKh" // wird dynamisch eryzeugt und haengt deshalb hinten an
		},
		{
			iConvSequenceID: 3,
			u8sSenderURI: "sip:pws@estos.de",
			asnCreateTime: "2020-10-14T13:02:00.000Z",
			asnChatMessage: {
					u8sMessage: "answer"
				},
			u8sEventCrossRefID: "jBrAffRDPlOKh"
		}
	];

window.addEventListener("load", function() {
	document.getElementById("btnChat").addEventListener("click", function(e) {
			var db = new Dexie("Chat");

			// one store for ALL messages even which conversation
			db.version(1).stores({
				messages: "u8sEventCrossRefID, iConvSequenceID"
			});

			g_rgChat.forEach(message => {
				message.u8sEventCrossRefID = message.u8sEventCrossRefID || message.iConvSequenceID.toString();
				db.messages.put(message).then(function(key) { // https://dexie.org/docs/Table/Table.put()
					console.log("put:", key, "done!");
				}).catch(function(error) {
					console.log("error:", error);
				});
			})
		});
	document.getElementById("btnConv").addEventListener("click", function(e) {
			var db = new Dexie("Conversations");

			// one store per conversation
			// https://dexie.org/docs/Tutorial/Getting-started
			db.version(1).stores(g_stores);
			g_rgConversation.forEach(message => {
				message.u8sEventCrossRefID = message.u8sEventCrossRefID || message.iConvSequenceID.toString();
				db.Cpsi_pws.put(message).then(function(key) {
					console.log("put:", key, "done!");
				}).catch(function(error) {
					console.log("error:", error);
				});
			});
		});
	document.getElementById("btnPage").addEventListener("click", function(e) {
		var db = new Dexie("Conversations");

		// one store per conversation
		db.version(1).stores(g_stores);

		db.Cpsi_pws.where("iConvSequenceID").aboveOrEqual(2).each(function (message) {
			console.log("Found: ", message);
		}).catch(function (error) {
			console.error(error);
		});

		db.Cpsi_pws.get("2").then(function (message) {
			console.log("Found: ", message);
			console.assert(db.isOpen(), "not open");
			eChat.count(db.backendDB(), "Cpsi_pws");
		}).catch(function (error) {
			console.error(error);
		});
	});
});
