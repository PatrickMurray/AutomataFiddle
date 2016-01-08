<?php

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	$GIT_PATH = "/var/www/AutomataFiddle";
	shell_exec("cd $GIT_PATH; git pull origin master; service apache2 reload;");
}

print "Hello, World! Test";
