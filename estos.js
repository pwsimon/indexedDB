import * as eChat from './modules/mChat.js';

// predefined demo data to create stores
const blockSize = 2;
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
const g_schema = "u8sEventCrossRefID, iConvSequenceID"; // The first entry in the schema string will always represent the primary key.
const g_stores = {
		Cpsi_pws: g_schema,
		Ceb_psi: g_schema
	};
const g_rgConversation = [
		{
			iConvSequenceID: 10,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:10:00.000Z", // date.toISOString()
			asnChatMessage: {
					u8sMessage: "hurts (even)"
				},
			u8sEventCrossRefID: "jBnFffRDPlOKh"
		},
		{
			iConvSequenceID: 15,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:15:00.000Z", // date.toISOString()
			asnChatMessage: {
					u8sMessage: "anywhere (odd)"
				},
			u8sEventCrossRefID: "jBRffxRDPltKh"
		},
		{
			iConvSequenceID: 20,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:20:00.000Z",
			asnChatMessage: {
					u8sMessage: "wurts (even)"
				}
			// u8sEventCrossRefID: "jBnFffRDPlOKh" // wird dynamisch eryzeugt und haengt deshalb hinten an
		},
		{
			iConvSequenceID: 23,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:23:00.000Z",
			asnChatMessage: {
					u8sMessage: "wurts (odd)"
				}
			// u8sEventCrossRefID: "jBnFffRDPlOKh" // wird dynamisch eryzeugt und haengt deshalb hinten an
		},
		{
			iConvSequenceID: 27,
			u8sSenderURI: "sip:psi@estos.de",
			asnCreateTime: "2020-10-14T13:27:00.000Z",
			asnChatMessage: {
					u8sMessage: "gerhard (odd)"
				}
			// u8sEventCrossRefID: "jBnFffRDPlOKh" // wird dynamisch eryzeugt und haengt deshalb hinten an
		},
		{
			iConvSequenceID: 30,
			u8sSenderURI: "sip:pws@estos.de",
			asnCreateTime: "2020-10-14T13:30:00.000Z",
			asnChatMessage: {
					u8sMessage: "answer (even)"
				},
			u8sEventCrossRefID: "jBrAffRDPlOKh"
		}
	];
function insert(oStore, rgInsert) {
	rgInsert.forEach(message => {
		message.u8sEventCrossRefID = message.u8sEventCrossRefID || message.iConvSequenceID.toString();
/*
* das put ist zwar async aber nicht das forEach
* wie bekomme ich EINEN trigger wenn ALLE put's fertig sind?
* siehe: insertAsync(), insertBulk()
* unterschied zwischen table.put() und table.Add()
*/
		oStore.put(message).then(function(key) { https://dexie.org/docs/Dexie/Dexie.%5Btable%5D
			console.log("put:", key, "done!");
		}).catch(function(error) {
			console.log("error:", error);
		});
	});
}
function insertAsync(oStore, rgInsert) {
	// returnWert ist ein Array of Promises
	return rgInsert.map(msg => {
			msg.u8sEventCrossRefID = msg.u8sEventCrossRefID || msg.iConvSequenceID.toString();
			oStore.put(msg);
		});
}
function insertTransaction() {
	
}
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
		});
	});
	document.getElementById("btnConv").addEventListener("click", function(e) {
		var db = new Dexie("Conversations");

		// one store per conversation
		// https://dexie.org/docs/Tutorial/Getting-started
		db.version(1).stores(g_stores);
		const rgOdd = g_rgConversation.filter(Msg => Msg.iConvSequenceID % 2),
			rgInsert = rgOdd.map(msg => { // fuer ein bulkAdd() muessen wir alle Key's garantieren
					msg.u8sEventCrossRefID = msg.u8sEventCrossRefID || msg.iConvSequenceID.toString();
					return msg;
				});
		db.Cpsi_pws.bulkAdd(rgInsert).then(key => {  // https://dexie.org/docs/Table/Table.bulkAdd()
			console.log("bulkAdd() lastKey:", key, "done!");
		}).catch(function(error) {
			console.log("error:", error);
		});
	});
	document.getElementById("btnInsert").addEventListener("click", function(e) {
		var db = new Dexie("Conversations");

		// one store per conversation
		// https://dexie.org/docs/Tutorial/Getting-started
		db.version(1).stores(g_stores);
		const rgInsert = g_rgConversation.filter(Msg => !(Msg.iConvSequenceID % 2)),
			rgPromise = insertAsync(db.Cpsi_pws, rgInsert);

		Promise.all(rgPromise).then(values => {
			console.log("inserts: ", values.length);
		});
	});
	document.getElementById("btnHashLocation").addEventListener("click", e => {
			var db = new Dexie("Conversations");

			// one store per conversation
			db.version(1).stores(g_stores);

			db.Cpsi_pws.where("iConvSequenceID") // return https://dexie.org/docs/WhereClause/WhereClause
				.aboveOrEqual(23) // return https://dexie.org/docs/Collection/Collection
				.limit(blockSize) // return https://dexie.org/docs/Collection/Collection
				.each(function (message) {
						console.log("aboveOrEqual(23), Found: ", message);
					}).catch(function (error) {
						console.error(error);
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
