#! /usr/bin/env bash

USER_NAME="www-data"
USER_HOME="/var/www"
APACHE_GROUP="www-data"

if [ $EUID -ne 0 ] ; then
	echo "The web server setup script must be run as root."
	exit 1
fi

# Add the Debian Jessie backports for Lets Encrypt and CertBot
echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list

# Update package list and upgrade all installed packages
apt-get update
apt-get upgrade -y

# Install Fail2Ban, Apache, PHP, MySQL Interface, Git, and GraphViz
apt-get install sudo fail2ban apache2 php5 libapache2-mod-php5 php5-mysql php5-mcrypt php5-apcu git graphviz -y

# Stop the Apache2 service before we begin modifying configuration files
service apache2 stop

# Grant www-data permission to use Git and modify the Apache service
echo "git        ALL = ($USER_NAME) /usr/bin/git"         >> /etc/sudoers
echo "$USER_NAME ALL = NOPASSWD:     /etc/init.d/apache2" >> /etc/sudoers

# Grant www-data permission to modify /var/www
chgrp -R $APACHE_GROUP $USER_HOME
chmod -R g+w $USER_HOME
chmod g+s $USER_HOME

# Remove the git repository if it exists, and clone it again.
cd $USER_HOME;
if [ -d $USER_NAME ] ; then
	sudo -u $USER_NAME rm -rf AutomataFiddle
fi
sudo -u $USER_NAME git clone https://github.com/PatrickMurray/AutomataFiddle.git
cd ~;


if [ -f /etc/apache2/apache2.conf ] ; then
	rm /etc/apache2/apache2.conf;
fi

if [ -f /etc/apache2/sites-enabled/000-default.conf ] ; then
	rm /etc/apache2/sites-enabled/000-default.conf;
fi

if [ -f /etc/apache2/sites-enabled/automatafiddle.conf ] ; then
	rm /etc/apache2/sites-enabled/automatafiddle.conf;
fi

ln -s $USER_HOME/AutomataFiddle/config/apache2/apache2.conf /etc/apache2/apache2.conf
ln -s $USER_HOME/AutomataFiddle/config/apache2/automatafiddle.conf /etc/apache2/sites-enabled/automatafiddle.conf

a2enmod rewrite
a2enmod ssl



# Install Let Encrypt and CertBot
apt-get install python-certbot-apache -t jessie-backports -y

# Get started with CertBot
certbot --apache certonly

# Create systemd service and timer files
if [ -f /etc/systemd/system/automatafiddle-ssl-renew.timer ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.timer;
fi

if [ -f /etc/systemd/system/automatafiddle-ssl-renew.service ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.service;
fi

ln -s $USER_HOME/AutomataFiddle/config/systemd/automatafiddle-ssl-renew.timer /etc/systemd/system/automatafiddle-ssl-renew.timer
ln -s $USER_HOME/AutomataFiddle/config/systemd/automatafiddle-ssl-renew.service /etc/systemd/system/automatafiddle-ssl-renew.service

chmod +x $USER_HOME/AutomataFiddle/services/automatafiddle-ssl-renew.sh

# Enabling the auto-renew service
systemctl start /etc/systemd/system/automatafiddle-ssl-renew.timer
systemctl enable /etc/systemd/system/automatafiddle-ssl-renew.timer


service apache2 start
