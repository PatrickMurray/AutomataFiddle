<?php


require_once "../graph.php";


function http_get_request_body()
{
	return file_get_contents("php://input");
}


if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	$git_code    = -1;
	$apache_code = -1;
	
	exec("git pull origin master",          $null, $git_code);
	exec("sudo /etc/init.d/apache2 reload", $null, $apache_code);
	
	if ($git_code < 0 || $apache_code < 0)
	{
		header("HTTP/1.1 500 Internal Server Error");
		trigger_error("Webhook Error: git={$git_code}, apache={$apache_code}");
		exit(1);
	}
	
	header("HTTP/1.1 202 Accepted");
	exit(0);
}
else if ($_SERVER["REQUEST_URI"] === "/supported")
{
	$supported = array(
		"directions" => $GRAPH_DIRECTIONS,
		"formats"    => $GRAPH_EXPORT_FORMATS,
		"shapes"     => $GRAPH_NODE_SHAPES
	);
	
	print(json_encode($supported));
	exit(0);
}
else if ($_SERVER["REQUEST_URI"] === "/render")
{
	/*
	$body = http_get_request_body();
	$data = json_decode($body);
	print_r($data);
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

	print $graph->compile();
}
else
{
	header("HTTP/1.1 400 Bad Request");
	exit(1);
}
