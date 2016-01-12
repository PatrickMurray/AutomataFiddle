<?php

if ($_SERVER["REQUEST_URI"] === "/webhook")
{
	exec("git pull origin master",          NULL, $git_code);
	exec("sudo /etc/init.d/apache2 reload", NULL, $apache_code);
	
	print "Git: " . $git_code . "\n";
	print "Apache: " . $apache_code . "\n";
}
else
{
	print "Body:\n" . http_get_request_body();
}
