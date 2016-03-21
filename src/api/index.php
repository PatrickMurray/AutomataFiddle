<?php


require_once "../graph.php";


/*	
 *	SECURITY ADVISORY - XSS
 *	-----------------------
 *	
 *	In order to comply with the cross-origin resource sharing standard
 *	(CORS), we must define several HTTP headers to specify which resources
 *	may be accessed from any given origin domain.
 *	
 *	Please note that the API is expected to be interfaced through both CORS
 *	and JSONP. The origin header is not declared in JSONP requests but it
 *	is defined in CORS requests in order to perform origin verification; as
 *	a result, if the origin domain is specified we must verify that it is
 *	trustworthy before granting any resource allocations to it.
 *	
 *	References:
 *	- https://www.w3.org/TR/cors/
 *	- http://www.json-p.org/
 *	
 */
if (array_key_exists("HTTP_ORIGIN", $_SERVER))
{
	switch ($_SERVER["HTTP_ORIGIN"])
	{
		case "http://automatafiddle.com":
		case "https://automatafiddle.com":
			header("Access-Control-Allow-Origin: " . $_SERVER["HTTP_ORIGIN"]);
			header("Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS, HEAD");
			header("Access-Control-Max-Age: 1000");
			header("Access-Control-Allow-Headers: Content-Type");
	}
}


/* API functions (and error messages) are expected to return JSON objects. */
header('Content-Type: application/json');


/*	
 *	The main logical switch of the API currently supports the following
 *	functions, including:
 *	
 *	METHOD		URI		DESCRIPTION
 *	-----------------------------------------------------------------------
 *	POST	/webhook	pull the latest source code from the repository
 *				and reloads the web server
 *	
 *	GET	/supported	returns a list of features currently supported
 *				by the graphing library (i.e., directions,
 *				export formats, and node shapes)
 *	
 *	POST	/render		given a valid encoding of an automaton, the
 *				provided encoding will be compiled into a
 *				GraphViz dot file, rendered, and a JSON object
 *				containing the rendered image's media-type and
 *				base64 encoding will be returned
 *	
 *	In the future, the following functions may be added to support user
 *	authentication and allow for the storage and retrevial of users'
 *	automata diagrams:
 *	
 *	TODO
 *	
 *		/register
 *		/verify
 *		/login
 *		/signout
 *	
 *		/load
 *		/save
 *	
 */
switch (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))
{
	case "/webhook":
		/*	
		 *	TODO
		 *	
		 *	- Implement webhook verification.
		 *	
		 */
		
		/*	
		 *	Any requests other than POST requests are to be ignored
		 *	and receive a Method Not Allowed error and status code.
		 *	
		 */
		if ($_SERVER["REQUEST_METHOD"] !== "POST")
		{
			http_response_code(405);
			trigger_json_response(405, "Method Not Allowed");
			die();
		}
		
		/*	
		 *	If either updating the source code from the repository
		 *	fails or reloading the web server's configuration
		 *	fails, then respond with an Internal Server Error and
		 *	status code.
		 *	
		 */
		if (update_source() || reload_server())
		{
			http_response_code(500);
			trigger_json_response(500, "Internal Server Error");
			die();
		}
		
		/*	
		 *	Otherwise, respond with the HTTP status code 202
		 *	(Accepted), and a message confirming that the source
		 *	and server reload were successful.
		 *	
		 *	Note: In some circumstances, it may be helpful to
		 *	verify that the webhook was successful. In this case,
		 *	one can check the API's response on GitHub via:
		 *	
		 *		AutomataFiddle      >
		 *		Settings            >
		 *		Webhooks & services >
		 *		Edit                >
		 *		Recent Deliveries   >
		 *		Response
		 *	
		 */
		http_response_code(202);
		trigger_json_response(202, "Source update and server reload were successful.");
		die();
	
	case "/supported":
		/*	
		 *	Ignore anything other than GET requests and respond
		 *	with HTTP status code 405 to assert that the provided
		 *	method is not allowed.
		 *	
		 */
		if ($_SERVER["REQUEST_METHOD"] !== "GET")
		{
			http_response_code(405);
			trigger_json_response(405, "Method Not Allowed");
			die();
		}
		
		/* Compile a list of all supported features. */
		$features = array(
			"directions" => $GRAPH_DIRECTIONS,
			"formats"    => $GRAPH_EXPORT_FORMATS,
			"shapes"     => $GRAPH_NODE_SHAPES
		);
		
		/*	
		 *	Encode the list of features and check for any encoding
		 *	errors. If an encoding error has occurred, then respond
		 *	with an Internal Server Error HTTP status code and a
		 *	message detailing what caused the request to fail.
		 *	
		 */
		$supported = json_encode($features, JSON_PRETTY_PRINT);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(500);
			trigger_json_response(500, "Internal Server Error");
		}
		
		http_response_code(200);
		json_response($supported);
		die();
	
	case "/render":
		/* Once again, only allow POST requests. */
		if ($_SERVER["REQUEST_METHOD"] !== "POST")
		{
			http_response_code(405);
			trigger_json_response(405, "Method Not Allowed");
			die();
		}
		
		/*	
		 *	Raise a precondition error if the client's request does
		 *	not define a data value in their POST field.
		 *	
		 */
		if (!array_key_exists("data", $_POST))
		{
			http_response_code(412);
			trigger_json_response(412, "Precondition Failed");
			die();
		}
		
		/*	
		 *	Decode the client's payload and raise an error of their
		 *	payload is not a valid JSON encoding.
		 *	
		 *	Note: When decoding, the second argument of
		 *	json_decode, True, is required so that an associative
		 *	array is returned from the function - and not a PHP
		 *	stdClass object.
		 *	
		 */
		$payload = $_POST["data"];
		$request = json_decode($payload, True);
		
		if (json_last_error() !== JSON_ERROR_NONE)
		{
			http_response_code(400);
			trigger_json_response(400, "Bad Request");
			die();
		}
		
		/*	
		 *	As is good practice, never trust that the input
		 *	supplied by the user is valid - we must verify it
		 *	ourselves. If the provided JSON encoding is invalid,
		 *	return a Bad Request error and status code.
		 *	
		 */
		if (!valid_request($request))
		{
			http_response_code(400);
			trigger_json_response(400, "Bad Request");
			die();
		}
		
		/*	
		 *	Once the request has been determined to be valid, we
		 *	can handle the request and return a JSON encoding of
		 *	the rendered automata diagram.
		 *	
		 */
		$message = handle_render_request($request);
		
		
		/*	
		 *	Just to be safe, we encode the response JSON message
		 *	and verify that no errors occurred during its encoding.
		 *	
		 */
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
		/*	
		 *	If a user attempts to request a feature which does not
		 *	exists, we return the appropriate HTTP status code and
		 *	message.
		 *	
		 */
		http_response_code(501);
		trigger_json_response(501, "Not Implemented");
		die();
}


/*	
 *	Returns a formatted JSON message which specifies the staus code and
 *	message provided.
 *	
 *	@param		int		HTTP status code
 *	@param		string		message
 *	
 */
function trigger_json_response($code, $message)
{
	$error = array(
		"code"    => $code,
		"message" => $message
	);
	
	$response = json_encode($error, JSON_PRETTY_PRINT);
	json_response($response);
}


/*	
 *	Simply print's the provided JSON string, essentially a glorified print
 *	function.
 *
 *	Note:	As mentioned previously, the API is expected to interface with
 *		both CORS and JSONP requests. In order to comply with the
 *		latter, JSONP specifies a callback variable in its GET request.
 *		This callback value must be returned in the response message in
 *		the format below:
 *	
 *		Take:
 *			$response         = "{'hello':'world'}";
 *			$_GET["callback"] = 12345;
 *	
 *		The response message would be:
 *			12345({'hello':'world'})
 *	
 *	@param		array		response message
 *	
 */
function json_response($response)
{
	if (array_key_exists("callback", $_GET))
	{
		print($_GET["callback"] . "(" . $response . ")");
	}
	else
	{
		print($response);
	}
	die();
}


/*	
 *	Pulls the latest source code from the git repository. If an error
 *	occurs while updating the source, the program's exit status code
 *	*should* be a value other than zero.
 *	
 *	@return		int		exit status code
 *	
 */
function update_source()
{
	$exit_status = -1;
	
	exec("git pull origin master", $null, $exit_status);
	
	return $exit_status;
}


/*	
 *	Similar to update_source(), reload_server() does exactly that -
 *	reloading the server's configuration files after a source code update.
 *	The function return's apache's exit code, if an error occurs, it
 *	*should* be a value other than zero.
 *	
 *	@return		int		exit status code
 */
function reload_server()
{
	$exit_status = -1;

	exec("sudo /etc/init.d/apache2 reload", $null, $exit_status);
	
	return $exit_status;
}


/*	
 *	Provided an array representing a decoded JSON request, determines if
 *	that request is a valid automaton diagram.
 *	
 *	Please note that a valid automaton diagram request is of the format:
 *	
 *		{
 *	 		"direction": "LR",
 *			"export":    "svg",
 *			"nodes": [
 *				{
 *					"name":  "Q0",
 *					"shape": "doublecircle"
 *				},
 *				.
 *				.
 *				.
 *			],
 *			"edges": [
 *				{
 *					"origin":      "Q0",
 *					"destination": "Q1",
 *					"label":       "0"
 *				},
 *				.
 *				.
 *				.
 *			]
 *		}
 *	
 *	@param		array		decoded JSON automaton diagram request
 *	
 *	@return		bool
 *	
 */
function valid_request($request)
{
	global $GRAPH_DIRECTIONS;
	global $GRAPH_EXPORT_FORMATS;
	global $GRAPH_NODE_SHAPES;
	
	/*	
	 *	An automata render request must contain only four fields
	 *	specifying its:
	 *	
	 *		- direction
	 *		- export format
	 *		- nodes
	 *		- edges
	 *	
	 */
	if (count($request) !== 4                    ||
	    !array_key_exists("direction", $request) ||
	    !array_key_exists("export",    $request) ||
	    !array_key_exists("nodes",     $request) ||
	    !array_key_exists("edges",     $request))
	{
		return False;
	}
	
	/*	
	 *	Secondly, the direction and export format specified must be
	 *	valid - that is, they're supported by the graphing library.
	 *	Additionally, the nodes and edges fields must be an array.
	 *	
	 */
	if (!in_array($request["direction"], array_keys($GRAPH_DIRECTIONS))     ||
	    !in_array($request["export"],    array_keys($GRAPH_EXPORT_FORMATS)) ||
	    gettype($request["nodes"]) !== "array"                              ||
	    gettype($request["edges"]) !== "array")
	{
		return False;
	}
	
	/*	
	 *	Next, the nodes specified must be validated. This is
	 *	accomplished by verifiying that:
	 *	
	 *		- each node is in the valid format
	 *		- there are no duplicate nodes
	 *		- the shape of a node is valid
	 *	
	 *	This is done by traversing through the list of nodes and
	 *	testing each of these conditions.
	 */
	$names = array();
	
	foreach ($request["nodes"] as $node)
	{
		/* Verify node format */
		if (count($node) !== 2                ||
		    !array_key_exists("name",  $node) ||
		    !array_key_exists("shape", $node))
		{
			return False;
		}
		
		/* Check for duplicate nodes */
		if (in_array($node["name"], $names))
		{
			return False;
		}
		array_push($names, $node["name"]);
		
		/* Verify node shape is valid */
		if (!in_array($node["shape"], array_keys($GRAPH_NODE_SHAPES)))
		{
			return False;
		}
	}
	
	
	/*	
	 *	Now that all the nodes have been determined to be valid, we
	 *	must then verify the edges against the list of nodes. This is
	 *	done by:
	 *	
	 *		- verifying the format of edges
	 *		- checking for undefined nodes in edge transitions
	 *		- checking for duplicate edges
	 *	
	 */
	$map = array();
	
	foreach ($request["edges"] as $edge)
	{
		/* Verify edge format */
		if (count($edge) !== 3                          ||
		    !in_array("origin",      array_keys($edge)) ||
		    !in_array("destination", array_keys($edge)) ||
		    !in_array("label",       array_keys($edge)))
		{
			return False;
		}
		
		$origin      = $edge["origin"];
		$destination = $edge["destination"];
		$label       = $edge["label"];
		
		/* If the origin or destination nodes are undefined */
		if (!in_array($origin,      $names) ||
		    !in_array($destination, $names))
		{
			return False;
		}
		
		/* If the origin has not been encountered on the map */
		if (!in_array($origin, array_keys($map)))
		{
			array_push($map, $origin);
			$map[$origin] = array();
		}
		
		/* Check for duplicate edges */
		if (in_array(array($destination => $label), $map[$origin]))
		{
			return False;
		}
		
		/* Add the valid, origin-destination pair to the map */
		array_push($map[$origin], array($destination => $label));
	}
	
	return True;
}


/*	
 *	Handles valid automaton render requests and returns an array containing
 *	the diagram's media type and a base64 encoding of the image. The 
 *	returned array will be used by the client to show a live preview of
 *	their automaton.
 *	
 *	@param		array		decoded JSON automaton render request
 *	
 *	@return		array		response message (mediatype & base64)
 *	
 */
function handle_render_request($request)
{
	$graph = new Graph();
	
	/* Assign the requested graph direction and export format */
	$graph->set_direction($request["direction"]);
	$graph->set_export_format($request["export"]);
	
	/* Add each node and set its shape */
	foreach ($request["nodes"] as $node)
	{
		$graph->add_node($node["name"]);
		$graph->set_node_shape($node["name"], $node["shape"]);
	}
	
	/* Add each edge */
	foreach ($request["edges"] as $edge)
	{
		$graph->add_edge(
			$edge["origin"],
			$edge["destination"],
			$edge["label"]
		);
	}
	
	/* Export each graph and lookup it's mediatype */
	$binary    = $graph->export();
	$mediatype = export_media_type($request);
	$encoding  = base64_encode($binary);
	
	$response = array(
		"mediatype" => $mediatype,
		"encoding"  => $encoding
	);
	
	return $response;
}


/*	
 *	Given a valid render request, returns the appropriate mediatype for the
 *	base64 encoding of its response image.
 *	
 *	@param		array		decoded JSON automaton render request
 *	
 *	@return		string
 *	
 */
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
