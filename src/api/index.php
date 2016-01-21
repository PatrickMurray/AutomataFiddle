<?php


require_once "../graph.php";


switch ($_SERVER["REQUEST_URI"])
{
	case "/webhook":
		if ($_SERVER["REQUEST_METHOD"] !== "POST")
		{
			http_response_code(405);;
			die("HTTP 405 Method Not Allowed");
		}

		update_source();
		
		http_response_code(202);
		die("Source update and server reload were successful.");
	
	case "/supported":
		if ($_SERVER["REQUEST_METHOD"] !== "GET")
		{
			http_response_code(405);
			die("HTTP 405 Method Not Allowed");
		}

		$features = array(
			"directions" => $GRAPH_DIRECTIONS,
			"formats"    => $GRAPH_EXPORT_FORMATS,
			"shapes"     => $GRAPH_NODE_SHAPES
		);

		$supported = json_encode($features);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(500);
			die("An error occured while encoding our JSON response!");
		}
		
		http_response_code(200);
		die($supported);
	
	case "/render":
		if ($_SERVER["REQUEST_METHOD"] !== "GET")
		{
			http_response_code(405);
			die("HTTP 405 Method Not Allowed");
		}
		/*
		$payload = file_get_contents("php://input");
		$request = json_decode($payload);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(400);
			die("An error occurred while decoding your JSON request!");
		}
		
		if (!valid_request($request))
		{
			http_response_code(400);
			die("Your JSON request is not valid!");
		}
		*/
		$response = handle_request($request);
		
		http_response_code(200);
		die($response);
	
	default:
		http_response_code(501);
		die("Huh, looks like we haven't finished this yet!");
}


function update_source()
{
	$git_exit    = -1;
	$apache_exit = -1;
	
	exec("git pull origin master",          $null, $git_exit);
	exec("sudo /etc/init.d/apache2 reload", $null, $apache_exit);
	
	if ($git_exit < 0 || $apache_exit < 0)
	{
		http_response_code(500);
		trigger_error("Webhook Error: git exited with code {$git_exit}, apache2 exited with code {$apache_exit}");
		exit(1);
	}
}


function valid_request($request)
{
	return True;
}


function handle_request($request)
{
	/*
	$body = http_get_request_body();
	$data = json_decode($body);
	print_r($data);
	*/
	
	/*
	
	CLIENT -> SERVER
	{
		"direction": "LR",
		"export": "svg",
		"nodes": [
			{
				"name": "Q0",
				"shape": "circle"
			},
			{
				...
			}
			.
			.
			.
		],
		"edges": [
			{
				"origin": "Q0",
				"destination": "Q1",
				"label": "A"
			},
			{
				...
			}
			.
			.
			.
		]
	}

	SERVER -> CLIENT
	{
		"src": "data:image/png;base64,iVBORw0KGg..."
	}

	OR
	
	{
		"error": 501,
		"message": "An unknown error occurred!"
	}

	*/

	$graph = new Graph();
	
	$graph->set_direction("LR");
	$graph->set_export_format("svg");
	
	$graph->add_node("");
	$graph->add_node("Q0");
	$graph->add_node("Q1");
	$graph->add_node("Q2");
	$graph->add_node("Q3");
	
	$graph->set_node_shape("", "none");
	$graph->set_node_shape("Q0", "circle");
	$graph->set_node_shape("Q1", "doublecircle");
	$graph->set_node_shape("Q2", "doublecircle");
	$graph->set_node_shape("Q3", "circle");

	$graph->add_edge("", "Q0");
	$graph->add_edge("Q0", "Q1", "A");
	$graph->add_edge("Q0", "Q3", "B");
	$graph->add_edge("Q1", "Q1", "A");
	$graph->add_edge("Q1", "Q2", "B");
	$graph->add_edge("Q2", "Q2", "A");
	$graph->add_edge("Q2", "Q3", "B");
	$graph->add_edge("Q3", "Q3", "A, B");
	
	return $graph->export();
}
