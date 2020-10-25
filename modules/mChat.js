/*
* this module is designed to work with "native IndexedDB database instance"
* https://dexie.org/docs/Dexie/Dexie.backendDB()
*/
const storeName = "databaseId";

function count(backendDB, sStoreName) {
	var request = backendDB.transaction(sStoreName)
		.objectStore(sStoreName)
		.count();

	request.onsuccess = function(event) {
		console.log("count:", request.result);
	};
}

export { storeName, count }; // 