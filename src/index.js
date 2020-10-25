/*
* needs Babel transpile and sourceMaps
*/
window.addEventListener("load", function() {
	console.log("enter index.js::onload()");
	document.getElementById("btnQuery").addEventListener("click", e => {
			console.log("here we go from babel transpiler");
		});
});
