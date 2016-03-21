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
	
	set_initial_graph_state();
	render_graph();

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
		//download_event();
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
		type:     "GET",
		url:      "http://api.automatafiddle.com/supported",
		dataType: "jsonp",
		async:    false,
		
		success: function (data, text) {
			console.info("Loaded: http://api.automatafiddle.com/supported");
			supported = data;
			
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

		error: function (request, status, error) {
			trigger_error("Unable to load supported features!");
			console.error("Could not load: http://api.automatafiddle.com/supported");
			
			console.debug(request);
			console.debug(request.responseText);
			console.debug(status);
			console.debug(error);
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
	render_graph();
}


function render_graph() {
	$.ajax({
		type:        "POST",
		url:         "http://api.automatafiddle.com/render",
		crossDomain: true,
		
		data:        "data=" + JSON.stringify(current.graph),
		/*
		contentType: "application/json; charset=utf-8",
		dataType:    "json",
		*/

		success: function(response)
		{
			console.info("Rendered graph: http://api.automatafiddle.com/render");
			$(".preview img").attr("src", "data:" + response.mediatype + ";base64," + response.encoding);
			$(".actions .download").attr("src", "data:application/octet-stream;base64," + response.encoding);
		},
		
		error: function(response, status, error)
		{
			trigger_error("Unable to render graph!");
			console.error("Could not render graph: http://api.automatafiddle.com/render");
			
			console.debug("Graph Encoding:" + JSON.stringify(current.graph));
			console.debug("Server Response, Status, and Error:");
			console.debug(response);
			console.debug(status);
			console.debug(error);
		}
	});
}

/*
function download_event() {
	var temp;
	console.log("download event");

	temp = window.location.href;
	window.location.href = $(".preview img").attr("src");
	window.location.href = temp;
}
*/

function save_event() {
	console.log("save event");
}


function open_event() {
	console.log("open event");
}


function delete_event() {
	set_initial_graph_state();
	render_graph();

	console.log("delete event");
}

function set_initial_graph_state()
{
	current = {
		title: "",
		description: "",
		graph: {
			direction: "LR",
			export:    "svg",
			nodes: [],
			edges: []
		}
	};
}

function invert(array) {
	var inverted = {};
	var i;
	var value;
	
	for (i in array) {
		value = array[i];
		inverted[value] = i;
	}
	
	return inverted;
}

function add_state_event() {
	var name_form;
	var shape_form;
	var state_name;
	var state_shape;
	var node;
	var i;
	
	name_form  = $(".states .form input[name='state-name']");
	shape_form = $(".states .form select[name='state-shape']");
	
	state_name  = name_form.val();
	state_shape = shape_form.val();
	
	shape_lookup = invert(supported.shapes);
	
	node = {
		name:  state_name,
		shape: shape_lookup[state_shape]
	}
	
	/* Verify that a node with the same name doesn't already exist */
	if (contains_node(state_name)) {
		trigger_error("States must have unique names, duplicate states are not allowed.");
		return;
	}
	
	/* Verify that the shape is valid */
	if (node.shape == undefined) {
		trigger_error("The specified shape is not valid.");
		return;
	}

	/* Add the node */
	current.graph.nodes.push(node);
	
	/* Add the node to the list */
	$(".states .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"name\">" + state_name + "</span> - " + state_shape + "</div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	$(".states .list .element .fa-close").click(function (){
		remove_state_event(this);
	});

	/* Add the node to the transition select menu */
	$(".transitions .form select[name='transition-origin']").append("<option>" + state_name + "</option>");
	$(".transitions .form select[name='transition-destination']").append("<option>" + state_name + "</option>");

	/* Clear the form */
	name_form.val("");

	/* Render graph */
	render_graph();
}

function remove_state_event() {
	console.log("remove state event");
	
	/* Get node name */
	/* Remove node from current nodes */
	/* Remove all transitions with the node */
	/* Remove the node from origin and destination select fields */
}

function add_transition_event() {
	var label_form;
	var origin_form;
	var destination_form;
	
	var label_name;
	var origin_name;
	var destination_name;
	
	var edge;
	var i;

	label_form       = $(".transitions .form input[name='transition-label']");
	origin_form      = $(".transitions .form select[name='transition-origin']");
	destination_form = $(".transitions .form select[name='transition-destination']");
	
	label_name       = label_form.val();
	origin_name      = origin_form.val();
	destination_name = destination_form.val();
	
	/* Verify that the Origin is valid */
	if (!contains_node(origin_name)) {
		trigger_error("");
		return;
	}

	/* Verify that the Destination is valid */
	if (!contains_node(destination_name)) {
		trigger_error("");
		return;
	}

	/* Check that the edge doesn't already exist */
	for (i in current.graph.edges) {
		if (current.graph.edges[i].origin      == origin_name      &&
		    current.graph.edges[i].destination == destination_name &&
		    current.graph.edges[i].label       == label_name) {
			trigger_error("Transitions must be unique.");
			return;
		}
	}
	
	/* Make the edge, and insert it */
	edge = {
		origin:      origin_name,
		destination: destination_name,
		label:       label_name
	};
	
	/* Add the edge to the list */
	$(".transitions .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"origin\">" + origin_name + "</span> &rarr; <span class=\"destination\">" + destination_name + "</span> : <span class=\"label\">" + label_name + "</span></div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	$(".transitions .list .element .fa-close").click(function (){
		remove_transition_event(this);
	});
	
	/* Insert the edge */
	current.graph.edges.push(edge);

	/* Re-render the graph */
	render_graph();
}

function contains_node(node_name) {
	var i;
	for (i in current.graph.nodes) {
		if (current.graph.nodes[i].name == node_name) {
			return true;
		}
	}
	
	return false;
}

function remove_transition_event() {
	console.log("remove transition event");
}
