import * as eChat from './modules/mChat.js';

const g_rgChat = [
	{
		u8sEventCrossRefID: "jBnFffRDPlOKh",
		u8sConversationID: "psi@estos.de;pws@estos.de",
		iConvSequenceID: 1,
		u8sSenderURI: "sip:psi@estos.de",
		asnCreateTime: "2020-10-14T13:00:00.000Z", // date.toISOString()
		asnChatMessage: {
				u8sMessage: "hurts"
			}
	},
	{
		u8sEventCrossRefID: "",
		u8sConversationID: "psi@estos.de;pws@estos.de",
		iConvSequenceID: 2,
		u8sSenderURI: "sip:psi@estos.de",
		asnCreateTime: "2020-10-14T13:01:00.000Z",
		asnChatMessage: {
				u8sMessage: "wurts"
			}
	},
];

const g_rgConversation = [
		{
			u8sEventCrossRefID: "jBnFffRDPlOKh",
			iConvSequenceID: 1,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:00:00.000Z", // date.toISOString()
			asnChatMessage: {
					u8sMessage: "hurts"
				}
		},
		{
			u8sEventCrossRefID: "",
			iConvSequenceID: 2,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:01:00.000Z",
			asnChatMessage: {
					u8sMessage: "wurts"
				}
		},
	];

window.addEventListener("load", function() {
	document.getElementById("btnChat").addEventListener("click", function(e) {
			var db = new Dexie("Chat");

			// one store for ALL messages even which conversation
			db.version(1).stores({
				messages: "u8sEventCrossRefID, iConvSequenceID"
			});

			g_rgChat.forEach(message => {
				const sCrossRefId = message.u8sEventCrossRefID || message.iConvSequenceID.toString();
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
			db.version(1).stores({
				Cpsi_pws: "u8sEventCrossRefID, iConvSequenceID",
				Ceb_psi: "u8sEventCrossRefID, iConvSequenceID"
			});

			const sCrossRefId = g_rgConversation[0].u8sEventCrossRefID || g_rgChat[0].iConvSequenceID.toString();
			db.friends.put(g_rgConversation[0]).then(function(key) {
				console.log("put:", key, "done!");
			}).catch(function(error) {
				console.log("error:", error);
			});
		});
});
