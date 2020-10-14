const storeName = "databaseId";

function count(db) {
	var request = db.transaction(storeName)
		.objectStore(storeName)
		.count();

	request.onsuccess = function(event) {
		console.log("count:", request.result);
	};
}

export { storeName, count }; // 