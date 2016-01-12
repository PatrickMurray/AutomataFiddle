<?php

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
	}
}
else
{
	print "Body:\n" . http_get_request_body();
}
