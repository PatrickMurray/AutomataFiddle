var supported;
var dictionary;

var automaton;
var last_rendered;


$(document).ready(function()
{
	initialize();
});


function initialize()
{
	if (typeof(Storage) == undefined)
	{
		trigger_error("Your browser does not support Local Storage, Save and Open functionality will be limited.");
	}
	
	fetch_supported_api_features();
	
	init_action_menu();
	init_sidebar();
	
	init_default_automaton();
	render_automaton();
}


function trigger_error(message)
{
	$(".errors").append("<div class=\"error\"><i class=\"fa fa-exclamation-triangle\"></i> <strong>Error:</strong> <span>" + message + "</span> <i class=\"fa fa-times\"></i></div>");
	
	$(".error .fa-times").click(function()
	{
		$(this).parent().remove();
	});
}


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
	
	/* TODO Form Reset */
}


function render_automaton()
{
	var encoding;
	var filename;
	var extension;

	encoding = JSON.stringify(automaton.graph);
	
	$.ajax({
		type:        "POST",
		url:         "http://api.automatafiddle.com/render",
		crossDomain: true,
		data:        "data=" + encoding,
		
		success: function(response)
		{
			$(".preview img").attr("src", "data:" + response.mediatype + ";base64," + response.encoding);
			$(".actions .download").attr("href", "data:application/octet-stream;charset=utf-8;base64," + response.encoding);

			filename  = automaton.title;
			extension = automaton.graph.export;

			if (filename == "")
			{
				filename = "untitled";
			}
			
			$(".actions .download").attr("download", filename + "." + extension);
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
	render_automaton();
}


function save_event()
{
	/* TODO */
}


function open_event()
{
	/* TODO */
}


function delete_event()
{
	/* Reset title and description */
	$(".properties input[name='title']").val("");
	$(".properties textarea[name='description']").val("");
	
	/* Unselect Direction and Export Formats */
	$(".properties select[name] option").each(function () {
		$(this).removeAttr("selected");
	});

	$(".properties select[name='graph-direction'] option:first").attr("selected", "selected");
	$(".properties select[name='export-format'] option:first").attr("selected", "selected");
	
	/* Remove all States */
	$(".states .list .element").each(function () {
		$(this).remove();
	});

	/* Remove all Transitions */
	$(".transitions .list .element").each(function () {
		$(this).remove();
	});
	
	init_default_automaton();
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
	

	$(".states .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"name\">" + state_name + "</span> - " + state_shape + "</div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	$(".states .list .element .fa-close").click(function ()
	{
		remove_state_event(this);
	});
	
	/* Add the node to the transition select menu */
	$(".transitions .form select[name='transition-origin']").append("<option>" + state_name + "</option>");
	$(".transitions .form select[name='transition-destination']").append("<option>" + state_name + "</option>");
	
	/* Clear the form */
	name_form.val("");
	
	/* Render graph */
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
	for (i in automaton.graph.edges)
	{
		if (automaton.graph.edges[i].origin      == state_name ||
		    automaton.graph.edges[i].destination == state_name)
		{
			automaton.graph.edges.splice(i, 1);
		}
	}
	
	/* Remove states from the list */
	$(".states .list .element").each(function ()
	{
		if ($(this).find(".name").text() == state_name)
		{
			$(this).remove();
		}
	});
	
	/* Remove the node from origin and destination select fields */
	$(".transitions .form select[name='transition-origin'] option, .transitions .form select[name='transition-destination'] option").each(function ()
	{
		if ($(this).prop("disabled") == false &&
		    $(this).text() == state_name)
		{
			$(this).remove();
		}
	});
	
	/* Remove transitions with that state */
	$(".transitions .list .element").each(function ()
	{
		if ($(this).find(".origin").text()      == state_name ||
		    $(this).find(".destination").text() == state_name)
		{
			$(this).remove();
		}
	});
	
	/* Re-render the graph */
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
	
	/* Add the edge to the list */
	$(".transitions .list").append("<div class=\"element\"><div class=\"expand\"><span class=\"origin\">" + origin_name + "</span> &rarr; <span class=\"destination\">" + destination_name + "</span> : <span class=\"label\">" + label_name + "</span></div><div class=\"remove\"><i class=\"fa fa-close\"></i></div></div>");
	
	$(".transitions .list .element .fa-close").click(function ()
	{
		remove_transition_event(this);
	});
	
	/* Insert the edge */
	automaton.graph.edges.push(edge);

	/* Re-render the graph */
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
