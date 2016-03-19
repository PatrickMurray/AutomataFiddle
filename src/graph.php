<?php

if (!isset($GRAPH_TYPES))
{
	$GRAPH_TYPES = array("digraph", "graph");
}

if (!isset($GRAPH_EDGE_SYMBOL))
{
	$GRAPH_EDGE_SYMBOL = array(
		"digraph" => "->",
		"graph"   => "--"
	);
}

if (!isset($GRAPH_DIRECTIONS))
{
	$GRAPH_DIRECTIONS = array(
		"LR" => "Left to Right",
		"RL" => "Right to Left",
		"TB" => "Top to Bottom",
		"BT" => "Bottom to Top"
	);
}

if (!isset($GRAPH_EXPORT_FORMATS))
{
	$GRAPH_EXPORT_FORMATS = array(
		"svg" => "SVG Image (.svg)",
		"png" => "PNG Image (.png)",
		"gif" => "GIF Image (.gif)",
		"ps"  => "PostScript Document (.ps)"
	);
}

if (!isset($GRAPH_NODE_SHAPES))
{
	$GRAPH_NODE_SHAPES = array(
		"circle"       => "Circle",
		"doublecircle" => "Double Circle",
		"oval"         => "Oval",
		"triangle"     => "Triangle",
		"box"          => "Box",
		"rectangle"    => "Rectangle",
		"diamond"      => "Diamond",
		"star"         => "Star",
		"point"        => "Point",
		"plaintext"    => "Plaintext",
		"none"         => "None"
	);
}

class Node
{
	public $name;
	public $shape;
}

class Edge
{
	public $origin;
	public $destination;
	public $label;
}

class Graph
{
	private $type;
	private $direction;
	private $format;

	private $nodes = [];
	private $edges = [];
	
	public function __construct()
	{
		global $GRAPH_TYPES, $GRAPH_DIRECTIONS, $GRAPH_EXPORT_FORMATS;

		$this->type      = $GRAPH_TYPES[0];
		$this->direction = $GRAPH_DIRECTIONS[0];
		$this->format    = $GRAPH_EXPORT_FORMATS[0];
	}
	
	
	public function set_type($type)
	{
		global $GRAPH_TYPES;
		
		if (gettype($type) !== "string")
		{
			trigger_error("The provided graph type must be a string");
		}
		
		if (!in_array($type, $GRAPH_TYPES))
		{
			trigger_error("The provided graph type is not supported");
		}
		
		$this->type = $type;
	}
	
	
	public function set_direction($direction)
	{
		global $GRAPH_DIRECTIONS;
		
		if (gettype($direction) !== "string")
		{
			trigger_error("Graph direction must be a string");
		}
		
		if (!in_array($direction, $GRAPH_DIRECTIONS))
		{
			trigger_error("The provided graph direction is not supported");
		}
		
		$this->direction = $direction;
	}
	

	public function set_export_format($format)
	{
		global $GRAPH_EXPORT_FORMATS;
		
		if (gettype($format) !== "string")
		{
			trigger_error("The provided export format must be a string");
		}

		if (!in_array($format, $GRAPH_EXPORT_FORMATS))
		{
			trigger_error("The provided export format is not supported");
		}

		$this->format = $format;
	}
	
	
	public function add_node($name)
	{
		if (gettype($name) !== "string")
		{
			trigger_error("The provided node name must be a string");
		}
		
		if ($this->contains_node($name))
		{
			return;
		}
		
		$name = $this->sanitize($name);
		
		$node        = new Node();
		$node->name  = $name;
		$node->shape = NULL;
		
		array_push($this->nodes, $node);
	}
	
	
	public function set_node_shape($name, $shape)
	{
		global $GRAPH_NODE_SHAPES;
		
		if (gettype($name) !== "string")
		{
			trigger_error("The provided node name must be a string");
		}
		
		if (!in_array($shape, $GRAPH_NODE_SHAPES))
		{
			trigger_error("The provided node shape is not supported");
		}
		
		$name = $this->sanitize($name);
		
		if (!$this->contains_node($name))
		{
			trigger_error("The provided node does not exist");
		}
		
		foreach ($this->nodes as $node)
		{
			if ($node->name === $name)
			{
				$node->shape = $shape;
				break;
			}
		}
	}
	

	public function add_edge($origin_name, $destination_name, $label=NULL)
	{
		if (gettype($origin_name)      !== "string" &&
		    gettype($destination_name) !== "string" &&
		    gettype($label)            !== "string")
		{
			trigger_error("The provided origin, destination, and labels must be a string");
		}
		
		$origin_name      = $this->sanitize($origin_name);
		$destination_name = $this->sanitize($destination_name);
		
		if (!$this->contains_node($origin_name) ||
		    !$this->contains_node($destination_name))
		{
			trigger_error("The provided origin and/or destination do not exist");
		}
		
		if ($this->contains_edge($origin_name, $destination_name))
		{
			return;
		}
		
		$origin_node      = NULL;
		$destination_node = NULL;
		
		foreach ($this->nodes as $node)
		{
			if ($origin_name === $node->name) {
				$origin_node = $node;
			}
			
			if ($destination_name === $node->name)
			{
				$destination_node = $node;
			}
			
			if ($origin_node !== NULL && $destination_node !== NULL)
			{
				break;
			}
		}
		
		$label = $this->sanitize($label, True);
		
		$edge              = new Edge();
		$edge->origin      = $origin_node;
		$edge->destination = $destination_node;
		$edge->label       = $label;
		
		array_push($this->edges, $edge);
	}
	
	
	public function export()
	{
		$dotfile = tempnam(sys_get_temp_dir(), "dot");
		
		$handler = fopen($dotfile, "w");
		fwrite($handler, $this->compile());
		fclose($handler);
		
		ob_start();
		system("dot -T{$this->format} {$dotfile}", $return_code);
		$output = ob_get_clean();
		
		unlink($dotfile);
		
		if ($return_code < 0)
		{
			trigger_error("Export Error: dot returned " . $exit);
			exit(1);
		}
		
		return $output;
	}
	

	function compile()
	{
		global $GRAPH_EDGE_SYMBOL;

		$dot  = "{$this->type} {\n";
		$dot .= "\tbgcolor=transparent;\n";
		$dot .= "\trankdir={$this->direction};\n";
		
		foreach ($this->nodes as $node)
		{
			$dot .= "\t\"" . $node->name . "\"";
			
			if ($node->shape !== NULL)
			{
				$dot .= " [shape={$node->shape}]";
			}
			
			$dot .= ";\n";
		}
		
		foreach ($this->edges as $edge)
		{
			$dot .= "\t\"{$edge->origin->name}\" {$GRAPH_EDGE_SYMBOL[$this->type]} \"{$edge->destination->name}\"";
			
			if ($edge->label !== NULL)
			{
				$dot .= " [label=\"{$edge->label}\"]";
			}
			
			$dot .= ";\n";
		}
		
		$dot .= "}\n";
		
		return $dot;
	}
	
	private function contains_node($name)
	{
		foreach ($this->nodes as $node)
		{
			if ($node->name === $name)
			{
				return True;
			}
		}
		
		return False;
	}
	
	private function contains_edge($origin_name, $destination_name)
	{
		foreach ($this->edges as $edge)
		{
			$origin      = $edge->origin;
			$destination = $edge->destination;
			
			if ($origin_name      === $origin->name &&
			    $destination_name === $destination->name)
			{
				return True;
			}
		}
		
		return False;
	}

	private function sanitize($input, $preserve_spaces=False)
	{
		if (!$preserve_spaces)
		{
			$input = str_replace(" ", "-", $input);
		}
		
		$input = str_replace("\"", "\\\"", $input);
		
		return $input;
	}
}
