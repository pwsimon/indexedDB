import * as eChat from './modules/mChat.js';

function read() {
	var transaction = g_db.transaction(g_storeName);
	var objectStore = transaction.objectStore(g_storeName);
	var request = objectStore.get("00-03"); // key-format

	request.onerror = function(event) {
		alert("Unable to retrieve daa from database!");
	};

	request.onsuccess = function(event) {
		// Do something with the request.result!
		if(request.result) {
			alert("Name: " + request.result.name + ", Age: " + request.result.age + ", Email: " + request.result.email);
		} else {
			alert("Kenny couldn't be found in your database!");
		}
	};
}
function readAll() {
	var objectStore = g_db.transaction(g_storeName).objectStore(g_storeName);

	objectStore.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;

		if (cursor) {
			alert("Name for id " + cursor.key + " is " + cursor.value.name + ", Age: " + cursor.value.age + ", Email: " + cursor.value.email);
			cursor.continue();
		} else {
			alert("No more entries!");
		}
	};
}
function add() {
	var request = g_db.transaction(g_storeName, "readwrite")
		.objectStore(g_storeName)
		.add({ id: "00-03", name: "Kenny", age: 19, email: "kenny@planet.org" });

	request.onsuccess = function(event) {
		alert("Kenny has been added to your database.");
	};

	request.onerror = function(event) {
		alert("Unable to add data\r\nKenny is already exist in your database! ");
	}
}
function remove() {
	var request = g_db.transaction(g_storeName, "readwrite")
		.objectStore(g_storeName)
		.delete("00-03");

	request.onsuccess = function(event) {
		alert("Kenny's entry has been removed from your database.");
	};
}
window.onload = function() {
	document.getElementById("btnRead").addEventListener("click", read);
	document.getElementById("btnReadAll").addEventListener("click", readAll);
	document.getElementById("btnAdd").addEventListener("click", add);
	document.getElementById("btnRemove").addEventListener("click", remove);
	document.getElementById("btnCount").addEventListener("click", function(e) {
		console.log("enter btnCount::click()");
		eChat.count(g_db);
		console.log("leave btnCount::click()");
	})
}

//prefixes of implementation that we want to test
// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

//prefixes of window.IDB objects
// window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
// window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

if (!window.indexedDB) {
	window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

const chatData = [
		{ id: "00-01", name: "gopal", age: 35, email: "gopal@tutorialspoint.com", indeep: { more: "data" } },
		{ id: "00-02", name: "prasad", age: 32, email: "prasad@tutorialspoint.com" }
	];
var g_db;
var request = window.indexedDB.open("chat", 1);
const g_storeName = "databaseId";

request.onerror = function(event) {
	console.log("error: ");
};

request.onsuccess = function(event) {
	g_db = request.result;
	console.log("open: ", g_db.name, "succeded");
};

request.onupgradeneeded = function(event) {
	var _db = event.target.result;
	var objectStore = _db.createObjectStore(g_storeName, { keyPath: "id" });

	for (var i in chatData) {
		objectStore.add(chatData[i]);
	}
}
