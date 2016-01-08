<?php

print $_SERVER["REQUEST_URI"];

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	$GIT_PATH = "/var/www/AutomataFiddle";
	shell_exec("cd " . $GIT_PATH ."; git pull origin master; service apache2 reload;");
	print "Hello Git!";
}

print "Hello, World!";
