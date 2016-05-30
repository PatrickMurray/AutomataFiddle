var supported;
var dictionary;

var automaton;


/*
 *
 *
 */
$(document).ready(function()
{
	fetch_supported_api_features();
	
	init_action_menu();
	init_sidebar();
	init_default_automaton();
	
	render_interface();
	render_automaton();
});


/*
 *
 *
 */
function trigger_error(message)
{
	$(".errors").append(error_html(message));
	
	$(".error .fa-times").click(function()
	{
		$(this).parent().remove();
	});
}


/*
 *
 *
 */
function error_html(message)
{
	var html;
	
	html  = "<div class='error'>";
	html += "  <i class='fa fa-exclamation-triangle'></i>&nbsp;";
	html += "  <strong>Error:</strong>";
	html += "  <span>" + message + "</span>";
	html += "  <i class='fa fa-times'></i>";
	html += "</div>";

	return html;
}


/*
 *
 *
 */
function fetch_supported_api_features()
{
	var i;
	
	$.ajax({
		type:     "GET",
		url:      "http://api.automatafiddle.com/supported",
		dataType: "jsonp",
		async:    false,
		
		success: function (data, text)
		{
			supported  = data;
			dictionary = {
				directions: invert(data.directions),
				formats:    invert(data.formats),
				shapes:     invert(data.shapes)
			};
			

			for (i in supported.directions)
			{
				$(".properties select[name=\"graph-direction\"]").append("<option>" + supported.directions[i] + "</option>");
			}
			
			$(".properties select[name=\"graph-direction\"]:first").attr("selected");
			
			
			for (i in supported.formats)
			{
				$(".properties select[name=\"export-format\"]").append("<option>" + supported.formats[i] + "</option>");
			}

			$(".properties select[name=\"export-format\"]:first").attr("selected");
			
			
			for (i in supported.shapes)
			{
				$(".states select[name=\"state-shape\"]").append("<option>" + supported.shapes[i] + "</option>");
			}
			
			$(".states select[name=\"state-shape\"]:first").attr("selected");
		},

		error: function (request, status, error)
		{
			console.error("An error occurred while fetching: http://api.automatafiddle.com/supported");
			trigger_error("Unable to fetch supported API features");
			
			console.debug(request);
			console.debug(status);
			console.debug(error);
		}
	});
}


/*
 *
 *
 */
function invert(array)
{
	var i;
	var inverted = {};
	
	for (i in array)
	{
		inverted[array[i]] = i;
	}
	
	return inverted;
}


/*
 *
 *
 */
function init_action_menu()
{
	$(".actions .refresh").click(function (event)
	{
		refresh_event();
		event.preventDefault();
	});
	
	$(".actions .save").click(function (event)
	{
		save_event();
		event.preventDefault();
	});
	
	$(".actions .open").click(function (event)
	{
		open_event();
		event.preventDefault();
	});
	
	$(".actions .delete").click(function (event)
	{
		delete_event();
		event.preventDefault();
	});
}


function init_sidebar()
{
	var temp;
	
	sidebar_toggle(".toggle-menu > * header");
	sidebar_toggle(".toggle-menu .properties header");
	
	$(".toggle-menu header").click(function()
	{
		sidebar_hide_all();
		sidebar_toggle(this);
	});
	
	
	$(".properties input[name='title']").change(function ()
	{
		automaton.title = $(this).val();
		render_automaton();
	});
	
	$(".properties textarea[name='description']").change(function ()
	{
		automaton.description = $(this).val();
	});
	
	$(".properties select[name='graph-direction']").change(function ()
	{
		temp = $(this).val();
		
		automaton.graph.direction = dictionary.directions[temp];
		render_automaton();
	});
	
	$(".properties select[name='export-format']").change(function ()
	{
		temp = $(this).val();
		
		automaton.graph.export = dictionary.formats[temp];
		render_automaton();
	});
	
	
	$(".states button").click(function (event)
	{
		add_state_event();
		event.preventDefault();
	});
	
	$(".states .remove").click(function (event)
	{
		remove_state_event();
		event.preventDefault();
	});

	$(".transitions button").click(function (event)
	{
		add_transition_event();
		event.preventDefault();
	});

	$(".transitions .remove").click(function (event)
	{
		remove_transition_event();
		event.preventDefault();
	});
}


function init_default_automaton()
{
	automaton = {
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


function render_automaton()
{
	var encoding;
	var filename;
	var extension;
	
	encoding = JSON.stringify(automaton.graph);
	
	filename  = automaton.title;
	extension = automaton.graph.export;
	
	if (filename == "")
	{
		filename = "untitled";
	}
	
	$(".actions .download").attr("download", filename + "." + extension);
	
	
	$.ajax({
		type:        "POST",
		url:         "http://api.automatafiddle.com/render",
		crossDomain: true,
		data:        "data=" + encoding,
		
		success: function(response)
		{
			$(".preview img").attr("src", "data:" + response.mediatype + ";base64," + response.encoding);
			$(".actions .download").attr("href", "data:application/octet-stream;charset=utf-8;base64," + response.encoding);
		},
		
		error: function(response, status, error)
		{
			console.error("An error occurred while rendering the automaton:");
			trigger_error("Unable to render automaton!");
			
			console.debug("Automaton JSON Encoding:");
			console.debug(encoding);

			console.debug("Response:");
			console.debug(response);
			
			console.debug("Status:");
			console.debug(status);

			console.debug("Error:");
			console.debug(error);
		}
	});
}


function sidebar_toggle(element)
{
	var icon = $(element).children("i");
	var pane = $(element).parent();
	
	if (icon.hasClass("fa-angle-down"))
	{
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


function sidebar_hide_all()
{
	$(".toggle-menu > * header").each(function ()
	{
		if ($(this).children("i").hasClass("fa-angle-up"))
		{
			sidebar_toggle(this);
		}
	});
}


function refresh_event()
{
	render_interface();
	render_automaton();
}


function render_interface()
{
	render_properties_interface();
	render_states_interface();
	render_transitions_interface();
}


function render_properties_interface()
{
	/* SET TITLE */
	$(".properties input[name='title']").val(automaton.title);
	
	/* SET DESCRIPTION */
	$(".properties textarea[name='description']").text(automaton.description);
	
	/* SET GRAPH DIRECTION */
	$(".properties select[name='graph-direction'] option").filter(function (){
		return ($(this).text() == supported.directions[automaton.graph.direction]);
	}).prop("selected", true);
	
	/* SET EXPORT FORMAT */
	$(".properties select[name='export-format'] option").filter(function (){
		return ($(this).text() == supported.formats[automaton.graph.export]);
	}).prop("selected", true);
}


function render_states_interface()
{
	var state_name;
	var state_shape;
	
	/* ERASE STATES */
	$(".states .list .element").each(function(){
		$(this).remove();
	});
	
	/* ADD STATES */
	for (i in automaton.graph.nodes)
	{
		state_name  = automaton.graph.nodes[i].name;
		state_shape = supported.shapes[automaton.graph.nodes[i].shape];
		
		/* Add the state to the state's dropdown */
		$(".states .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"name\">" + state_name + "</span> - " + state_shape + "</div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	}

	/* Add click event listener to the state remove button */
	$(".states .list .element .fa-close").click(function ()
	{
		remove_state_event(this);
	});
}


function render_transitions_interface()
{
	var previous_origin;
	var previous_destination;
	var attribute;
	var state_name;
	var state_shape;
	var origin_name;
	var destination_name;
	var label_name;
	
	previous_origin      = $(".transitions .form select[name='transition-origin']").val();
	previous_destination = $(".transitions .form select[name='transition-destination']").val();

	/* ERASE STATES FROM ORIGIN AND DESTINATION */
	$(".transitions .form select[name='transition-origin'] option, .transitions .form select[name='transition-destination'] option").each(function(){
		attribute = $(this).attr("hidden");
		if (attribute == undefined || attribute == false)
		{
			$(this).remove();
		}
	});
	
	/* REMOVE TRANSITIONS */
	$(".transitions .list .element").each(function(){
		$(this).remove();
	});

	/* ADD STATES */
	for (i in automaton.graph.nodes)
	{
		state_name  = automaton.graph.nodes[i].name;
		state_shape = supported.shapes[automaton.graph.nodes[i].shape];
		
		/* Add the state to the transition select menu */
		$(".transitions .form select[name='transition-origin']").append("<option>" + state_name + "</option>");
		$(".transitions .form select[name='transition-destination']").append("<option>" + state_name + "</option>");
	}
	
	/* ADD TRANSITIONS */
	for (i in automaton.graph.edges)
	{
		origin_name      = automaton.graph.edges[i].origin;
		destination_name = automaton.graph.edges[i].destination;
		label_name       = automaton.graph.edges[i].label;

		/* Add the edge to the list */
		$(".transitions .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"origin\">" + origin_name + "</span> &rarr; <span class=\"destination\">" + destination_name + "</span> : <span class=\"label\">" + label_name + "</span></div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	}

	$(".transitions .list .element .fa-close").click(function ()
	{
		remove_transition_event(this);
	});
	
	$(".transitions .form select[name='transition-origin'] option").filter(function (){
		return ($(this).text() == previous_origin);
	}).prop("selected", true);
	
	$(".transitions .form select[name='transition-destination'] option").filter(function (){
		return ($(this).text() == previous_destination);
	}).prop("selected", true);
}


function save_event()
{
	var encoding;

	encoding = JSON.stringify(automaton);
	window.prompt(
		"Save your automaton's encoding for future use:",
		encoding
	);
}


function open_event()
{
	var encoding;
	
	if ((encoding = window.prompt("Please paste your automaton encoding:")) == null)
	{
		return;
	}

	try
	{
		automaton = JSON.parse(encoding);
		
		render_interface();
		render_automaton();
	}
	catch (exception)
	{
		trigger_error("Unable to decode the provided automaton!");
		console.info("Automaton JSON Parse:");
		console.error(exception);
	}
}


function delete_event()
{
	init_default_automaton();

	render_interface();
	render_automaton();
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
	
	/* Clear the form */
	name_form.val("");
	
	node = {
		name:  state_name,
		shape: dictionary.shapes[state_shape]
	}
	
	if (contains_node(state_name))
	{
		trigger_error("States must have unique name, " + state_name + " already exists");
		return;
	}
	
	if (node.shape == undefined)
	{
		trigger_error("The specified shape is not valid.");
		return;
	}
	
	automaton.graph.nodes.push(node);
	
	render_interface();
	render_automaton();
}


function remove_state_event(element) {
	var root;
	var state_name;
	var i;
	
	root = $(element).parent().parent();
	state_name = root.find(".expand .name").text();
	
	/* Remove node from current nodes */
	for (i in automaton.graph.nodes)
	{
		if (automaton.graph.nodes[i].name == state_name)
		{
			automaton.graph.nodes.splice(i, 1);
			break;
		}
	}
	
	/* Remove all transitions with the node */
	i = 0;
	for (i in automaton.graph.edges)
	{
		if (automaton.graph.edges[i].origin      == state_name ||
		    automaton.graph.edges[i].destination == state_name)
		{
			automaton.graph.edges.splice(i, 1);
		}
	}
	
	render_interface();
	render_automaton();
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
	if (!contains_node(origin_name))
	{
		trigger_error("Invalid Origin");
		return;
	}

	/* Verify that the Destination is valid */
	if (!contains_node(destination_name))
	{
		trigger_error("Invalid Destination");
		return;
	}

	/* Check that the edge doesn't already exist */
	for (i in automaton.graph.edges)
	{
		if (automaton.graph.edges[i].origin      == origin_name      &&
		    automaton.graph.edges[i].destination == destination_name)
		{
			trigger_error("Transitions must have unique origins and destinations.");
			return;
		}
	}
	
	/* Make the edge, and insert it */
	edge = {
		origin:      origin_name,
		destination: destination_name,
		label:       label_name
	};
	
	/* Insert the edge */
	automaton.graph.edges.push(edge);

	render_interface();
	render_automaton();
}

function contains_node(node_name) {
	var i;
	for (i in automaton.graph.nodes)
	{
		if (automaton.graph.nodes[i].name == node_name)
		{
			return true;
		}
	}
	
	return false;
}

function remove_transition_event(element) {
	var root;
	
	var origin_name;
	var destination_name;
	var label_name;
	
	var i;
	
	root = $(element).parent().parent();

	origin_name      = root.find(".origin").text();
	destination_name = root.find(".destination").text();
	label_name       = root.find(".label").text();
	
	for (i in automaton.graph.edges)
	{
		if (automaton.graph.edges[i].origin      == origin_name      &&
		    automaton.graph.edges[i].destination == destination_name &&
		    automaton.graph.edges[i].label       == label_name)
		{
			automaton.graph.edges.splice(i, 1);
			break;
		}
	}

	root.remove();
	render_automaton();
}
