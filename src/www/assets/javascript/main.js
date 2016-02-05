$(document).ready(function(){
	initialize();
});


function initialize() {
	sidebar_toggle(".toggle-menu > * header");
	sidebar_toggle(".toggle-menu .properties header");
	
	$(".toggle-menu header").click(function() {
		sidebar_hide_all();
		sidebar_toggle(this);
	});
	

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
		/* redirect to blank homepage */
		event.preventDefault();
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
	
}


function render_event() {
	
}


function download_event() {
	
}

function save_event() {
	
}

function open_event() {
	
}


function delete_event() {
	
}
