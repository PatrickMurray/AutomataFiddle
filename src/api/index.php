<?php

print shell_exec("whoami");

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	//shell_exec("git pull origin master;");
}
