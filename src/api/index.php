<?php


require_once "../graph.php";


switch (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))
{
	case "/webhook":
		if ($_SERVER["REQUEST_METHOD"] !== "POST")
		{
			http_response_code(405);;
			trigger_json_response(405, "Method Not Allowed");
			die();
		}

		update_source();
		
		http_response_code(202);
		trigger_json_response(202, "Source update and server reload were successful.");
	
	case "/supported":
		if ($_SERVER["REQUEST_METHOD"] !== "GET")
		{
			http_response_code(405);
			trigger_json_response(405, "Method Not Allowed");
			die();
		}
		
		$features = array(
			"directions" => $GRAPH_DIRECTIONS,
			"formats"    => $GRAPH_EXPORT_FORMATS,
			"shapes"     => $GRAPH_NODE_SHAPES
		);

		$supported = json_encode($features, JSON_PRETTY_PRINT);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(500);
			trigger_json_response(500, "An error occured while encoding our JSON response!");
		}
		
		http_response_code(200);
		json_response($supported);
		die();
	
	case "/render":
		if ($_SERVER["REQUEST_METHOD"] === "OPTIONS")
		{
			http_response_code(200);
			print("Allow: HEAD, GET, PUT, POST, DELETE, OPTIONS\n");
			die();
		}
		
		if ($_SERVER["REQUEST_METHOD"] !== "POST")
		{
			http_response_code(405);
			trigger_json_response(405, "Method Not Allowed");
			die();
		}
		
		$payload = $_POST["data"]; //file_get_contents("php://input");
		$request = json_decode($payload);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(400);
			trigger_json_response(400, "Bad Request");
			die();
		}
		
		if (!valid_request($request))
		{
			http_response_code(400);
			trigger_json_response(400, "Bad Request");
			die();
		}
		
		$message = handle_render_request($request);
		
		$response = json_encode($message, JSON_PRETTY_PRINT);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(500);
			trigger_json_response(500, "Internal Server Error");
			die();
		}
		
		http_response_code(200);
		json_response($response);
		die();
	
	default:
		http_response_code(501);
		trigger_json_response(501, "Not Implemented");
		die();
}


function trigger_json_response($code, $message)
{
	$error = array(
		"code"    => $code,
		"message" => $message
	);

	$response = json_encode($error, JSON_PRETTY_PRINT);
	
	json_response($response);
}


function json_response($response)
{
	/* Handle Cross Site Requests */
	switch ($_SERVER["HTTP_ORIGIN"])
	{
		case "http://automatafiddle.com":
		case "https://automatafiddle.com":
			header("Access-Control-Allow-Origin: *");
			header("Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS");
			header("Access-Control-Max-Age: 1000");
			header("Access-Control-Allow-Headers: Content-Type, Content-Disposition, Content-Description, Authorization, X-Requested-With");
	}
	
	header('Content-Type: application/json');
	
	if ($_GET["callback"])
	{
		print($_GET["callback"]."(".$response.")");
	}
	else
	{
		print($response);
	}
	
	die();
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
		trigger_json_response(500, "Internal Server Error");
	}
}



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
function valid_request($request)
{
	if (/*count($request) !== 4                 ||*/
	    !array_has_key("direction", $request) ||
	    !array_has_key("export",    $request) ||
	    !array_has_key("nodes",     $request) ||
	    !array_has_key("edges",     $request))
	{
		return False;
	}
	
	if (!in_array($request["direction"], $GRAPH_DIRECTIONS)     ||
	    !in_array($request["export"],    $GRAPH_EXPORT_FORMATS) ||
	    gettype($request["nodes"]) !== "array"                  ||
	    gettype($request["edges"]) !== "array")
	{
		return False;
	}
	
	$names = array();

	foreach ($request["nodes"] as $node)
	{
		if (/*count($node) !== 2            ||*/
		    !array_has_key("name", $node) ||
		    !array_has_key("shape", $node))
		{
			return False;
		}
		
		if (in_array($node["name"], $names))
		{
			return False;
		}
		
		array_push($names, $node["name"]);
		
		if (!in_array($node["shape"], $GRAPH_NODE_SHAPES))
		{
			return False;
		}
	}
	
	$map = array();
	
	foreach ($request["edges"] as $edge)
	{
		if (/*count($edge) !== 3              ||*/
		    !in_array("origin",      $edge) ||
		    !in_array("destination", $edge) ||
		    !in_array("label",       $edge))
		{
			return False;
		}
		
		$origin      = $edge["origin"];
		$destination = $edge["destination"];
		
		if (!in_array($origin,      $names) ||
		    !in_array($destination, $names))
		{
			return False;
		}
		
		if (!in_array($origin, $map))
		{
			array_push($map, $origin);
			$map[$origin] = array();
		}
		
		/* Duplicate Edge */
		if (in_array($destination, $map[$origin]))
		{
			return False;
		}
		
		array_push($map[$origin], $destination);
	}
	
	return True;
}


function handle_render_request($request)
{
	$graph = new Graph();
	
	$graph->set_direction($request["direction"]);
	$graph->set_export_format($request["export"]);
	
	foreach ($request["nodes"] as $node)
	{
		$graph->add_node($node["name"]);
		$graph->set_node_shape($node["name"], $node["shape"]);
	}
	
	foreach ($request["edges"] as $edge)
	{
		$graph->add_edge(
			$edge["origin"],
			$edge["destination"],
			$edge["label"]
		);
	}
	
	$binary    = $graph->export();
	$mediatype = export_media_type($request);
	$encoding  = base64_encode($binary);
	
	$response = array(
		"mediatype" => $mediatype,
		"encoding"  => $encoding
	);
	
	return $response;
}


function export_media_type($request)
{
	switch ($request["export"])
	{
		case "svg":
			return "image/svg+xml";
		case "png":
			return "image/png";
		case "gif":
			return "image/gif";
		case "ps":
			return "application/postscript";
		default:
			return "text/plain";
	}
}
