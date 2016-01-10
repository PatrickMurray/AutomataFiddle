<?php

echo "test";

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	print shell_exec("git pull origin master;");
}
