#! /usr/bin/env bash
apt-get update
apt-get upgrade -y

# Apache
apt-get install apache2 -y

# PHP
apt-get install php5 -y
apt-get install libapache2-mod-php5 -y
apt-get install php5-mysql -y
apt-get install php5-mcrypt -y

# Install Git
apt-get install git -y

# Add User
adduser automatafiddle --home /var/www --ingroup www-data
chgrp -R www-data /var/www
chmod -R g+w /var/www
chmod g+s /var/www

# Setup Git
su automatafiddle -c "cd ~; if [ -d 'AutomataFiddle']; then\n\t rm -rf AutomataFiddle;\nfi\ngit clone https://github.com/PatrickMurray/AutomataFiddle.git"

# Setup Configurations
if [ -f /etc/apache2/sites-enabled/000-default.conf]; then
	rm /etc/apache2/sites-enabled/000-default.conf
fi

ln -s /var/www/AutomataFiddle/config/apache2/automatafiddle.conf /etc/apache2/sites-enabled/automatafiddle.conf

service apache2 reload
