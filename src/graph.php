<?php

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
	
	private $supported_types      = ["graph", "digraph"];
	private $supported_directions = ["TB", "LR", "BT", "RL"];
	private $supported_formats    = ["ps", "svg", "png", "gif"];
	private $supported_shapes     = [
		"box", "oval", "circle", "point", "triangle", "plaintext",
		"diamond", "doublecircle", "rectangle", "star", "none"
	];
	
	private $edge_symbol = [
		"graph"   => "--",
		"digraph" => "->"
	];
	
	
	public function __construct()
	{
		$this->type      = "graph";
		$this->direction = "LR";
		$this->format    = "svg";
	}
	
	
	public function set_type($type)
	{
		if (gettype($type) !== "string")
		{
			trigger_error("The provided graph type must be a string");
		}
		
		if (!in_array($type, $this->supported_types))
		{
			trigger_error("The provided graph type is not supported");
		}
		
		$this->type = $type;
	}
	
	
	public function set_direction($direction)
	{
		if (gettype($direction) !== "string")
		{
			trigger_error("Graph direction must be a string");
		}
		
		if (!in_array($direction, $this->supported_directions))
		{
			trigger_error("The provided graph direction is not supported");
		}
		
		$this->direction = $direction;
	}
	

	public function set_export_format($format)
	{
		if (gettype($format) !== "string")
		{
			trigger_error("The provided export format must be a string");
		}

		if (!in_array($format, $this->supported_formats))
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
		if (gettype($name) !== "string")
		{
			trigger_error("The provided node name must be a string");
		}

		if (!in_array($shape, $this->supported_shapes))
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
		
		$svg = shell_exec("dot -T" . $this->format . " " . $dotfile);
		
		unlink($dotfile);
		
		return $svg;
	}
	

	function compile()
	{
		$dot  = $this->type . " {\n";
		$dot .= "\tbgcolor=transparent;\n";
		$dot .= "\trankdir=" . $this->direction . ";\n";
		
		foreach ($this->nodes as $node)
		{
			$dot .= "\t\"" . $node->name . "\"";
			
			if ($node->shape !== NULL)
			{
				$dot .= " [shape=" . $node->shape . "]";
			}
			
			$dot .= ";\n";
		}
		
		foreach ($this->edges as $edge)
		{
			$dot .= "\t\"" . $edge->origin->name . "\"";
			$dot .= " " . $this->edge_symbol[$this->type] . " ";
			$dot .= "\"" . $edge->destination->name . "\"";
			
			if ($edge->label !== NULL)
			{
				$dot .= " [label=\"" . $edge->label . "\"]";
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
