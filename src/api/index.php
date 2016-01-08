<?php

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	$GIT_PATH = "/var/www/AutomataFiddle";
	print shell_exec("cd " . $GIT_PATH ."; git pull origin master; service apache2 reload;");
}
