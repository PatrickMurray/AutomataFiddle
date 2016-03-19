/* Globals */
var supported;
var current;


$(document).ready(function() {
	initialize();
});


function initialize() {
	init_action_menu();
	init_sidebar();
	init_features();
	
	/* If the client's browser does not support HTML5 Local Storage
	 * Objects, then notify the user that several functions (Save, Open)
	 * will not function properly.
	 */
	if (typeof(Storage) == "undefined") {
		trigger_error("Your browser does not support Local Storage, Save and Open functionality will be limited.");
	}
}


function init_action_menu() {
	$(".actions .refresh").click(function (event) {
		refresh_event();
		event.preventDefault();
	});
	
	$(".actions .download").click(function (event) {
		download_event();
		event.preventDefault();
	});
	
	$(".actions .save").click(function (event) {
		save_event();
		event.preventDefault();
	});
	
	$(".actions .open").click(function (event) {
		open_event();
		event.preventDefault();
	});
	
	$(".actions .delete").click(function (event) {
		delete_event();
		event.preventDefault();
	});
}


function init_sidebar() {
	sidebar_toggle(".toggle-menu > * header");
	sidebar_toggle(".toggle-menu .properties header");
	
	$(".toggle-menu header").click(function() {
		sidebar_hide_all();
		sidebar_toggle(this);
	});
	

	$(".states button").click(function (event) {
		add_state_event();
		event.preventDefault();
	});
	
	$(".states .remove").click(function (event) {
		remove_state_event();
		event.preventDefault();
	});

	$(".transitions button").click(function (event) {
		add_transition_event();
		event.preventDefault();
	});

	$(".transitions .remove").click(function (event) {
		remove_transition_event();
		event.preventDefault();
	});
}


function init_features() {
	$.ajax({
		url: "http://api.automatafiddle.com/supported",
		method: "GET",
		dataType: "jsonp",
		success: function (json) {
			console.info("Loaded: http://api.automatafiddle.com/supported");
			supported = json;
			
			var key;
			
			/* Graph Directions */
			for (key in supported.directions)
			{
				$(".properties select[name=\"graph-direction\"]").append("<option>" + supported.directions[key] + "</option>");
			}
			$(".properties select[name=\"graph-direction\"]:first-of-type").attr("selected");
			
			/* Export Format */
			for (key in supported.formats)
			{
				$(".properties select[name=\"export-format\"]").append("<option>" + supported.formats[key] + "</option>");
			}
			$(".properties select[name=\"export-format\"]:first-of-type").attr("selected");
			
			/* Shapes */
			for (key in supported.shapes)
			{
				$(".states select[name=\"state-shape\"]").append("<option>" + supported.shapes[key] + "</option>");
			}
			$(".states select[name=\"state-shape\"]:first-of-type").attr("selected");
		},
		error: function (json) {
			trigger_error("Unable to load supported features!");
			console.error("Could not load: http://api.automatafiddle.com/supported");
			console.debug(json);
		}
	});
}


function sidebar_toggle(element) {
	var icon = $(element).children("i");
	var pane = $(element).parent();
	
	if (icon.hasClass("fa-angle-down")) {
		icon.removeClass("fa-angle-down");
		icon.addClass("fa-angle-up");
		$(element).addClass("activated");
	} else {
		icon.removeClass("fa-angle-up");
		icon.addClass("fa-angle-down");
		$(element).removeClass("activated");
	}
	
	pane.children(".collapsable").toggle();
}


function sidebar_hide_all() {
	$(".toggle-menu > * header").each(function () {
		if ($(this).children("i").hasClass("fa-angle-up")) {
			sidebar_toggle(this);
		}
	});
}


function trigger_error(message) {
	$(".errors").append("<div class=\"error\"><i class=\"fa fa-exclamation-triangle\"></i> <strong>Error:</strong> <span>" + message + "</span> <i class=\"fa fa-times\"></i></div>");
	$(".error .fa-times").click(function() {
		close_error(this);
	});
}


function close_error(element) {
	$(element).parent().remove();
}


function refresh_event() {
	console.log("refresh event");
	render_graph();
}


function render_graph() {
	$.ajax({
		url:      "http://api.automatafiddle.com/render",
		method:   "GET",
		dataType: "jsonp",
		success: function (json) {
			// TODO
		},
		error: function (json) {
			console.error("Render Graph Error:");
			console.error(json.responseText);
		}
	});
}


function download_event() {
	console.log("download event");
}


function save_event() {
	console.log("save event");
}


function open_event() {
	console.log("open event");
}


function delete_event() {
	console.log("delete event");
}




function add_state_event() {
	console.log("add state event");
}

function remove_state_event() {
	console.log("remove state event");
}

function add_transition_event() {
	console.log("add transition event");
}

function remove_transition_event() {
	console.log("remove transition event");
}
