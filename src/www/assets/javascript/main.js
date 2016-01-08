$(document).ready(function(){
	initialize();
});


function initialize() {
	/* Side Menu */
	sidebar_toggle(".toggle-menu > * header");
	sidebar_toggle(".toggle-menu .properties header");
	
	$(".toggle-menu header").click(function() {
		sidebar_hide_all();
		sidebar_toggle(this);
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