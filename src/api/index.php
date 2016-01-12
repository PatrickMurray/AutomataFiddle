<?php

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
		trigger_error("Webhook Error: git returned " . $git_code . ", apache returned " . $apache_code);
		exit(1);
	}
	
	header("HTTP/1.1 202 Accepted");
	exit(0);
}
else
{
	$body = http_get_request_body();
	$data = json_decode($body);
	print_r($data);
}
