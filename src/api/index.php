<?php

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	print shell_exec("git pull origin master; sudo /etc/init.d/apache2 reload;");
}
