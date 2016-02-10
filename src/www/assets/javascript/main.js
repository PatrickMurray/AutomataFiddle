/*

automatons = [
	{
		"id": 9172512,
		"title": "My Automaton",
		"description": "",

	}
]

*/

$(document).ready(function(){
	initialize();
});


function initialize() {
	init_action_menu();
	init_sidebar();
	init_features();
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
	
	$(".states button").click(function (event){
		/* some stuff */
		render_automata();
		event.preventDefault();
	});
	
	$(".transitions button").click(function (event) {
		/* some stuff */
		render_automata();
		event.preventDefault();
	});
}


function init_features() {
	$.ajax({
		url: "http://api.automatafiddle.com/supported",
		method: "GET",
		dataType: "jsonp",
		success: function (json) {
			console.log(json);
		},
		error: function (json) {
			trigger_error("Unable to load supported features!");
			console.log(json);
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
	$(".errors").append("<div class=\"error\"><i class=\"fa fa-exclamation-triangle\"></i> <strong>Warning:</strong> <span>" + message + "</span> <i class=\"fa fa-times\"></i></div>");
	$(".error .fa-times").click(function() {
		close_error(this);
	});
}


function close_error(element) {
	$(element).parent().remove();
}


function refresh_event() {
	console.log("refresh event");
	render_event();
}


function render_event() {
	console.log("render event");
}


function download_event() {
	console.log("download event");
}


function save_event() {
	console.log("save event");
}


function open_event() {
	console.log("save event");
}


function delete_event() {
	console.log("save event");
}
