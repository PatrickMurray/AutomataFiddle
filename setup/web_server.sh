#! /usr/bin/env bash

USER_NAME="www-data"
USER_HOME="/var/www"
APACHE_GROUP="www-data"

if [ "$EUID" -ne 0 ] then
	echo "The web server setup script must be run as root."
	exit
fi

# Update package list and upgrade all installed packages
apt-get update
apt-get upgrade -y

# Install Fail2Ban, Apache, PHP, MySQL Interface, and Git
apt-get install sudo fail2ban apache2 php5 libapache2-mod-php5 php5-mysql php5-mcrypt git -y


# Grant www-data permission to use Git and modify the Apache service
echo "git        ALL = ($USER_NAME): /usr/bin/git pull"   >> /etc/sudoers
echo "$USER_NAME ALL = NOPASSWD:     /etc/init.d/apache2" >> /etc/sudoers

# Grant www-data permission to modify /var/www
chgrp -R $APCH_GRUP $USER_HOME
chmod -R g+w $USER_HOME
chmod g+s $USER_HOME

# Remove the git repository if it exists, and clone it again.
cd $USER_HOME;
if [ -d $USER_NAME ] ; then
	sudo -u $USER_NAME rm -rf AutomataFiddle
fi
sudo -u $USER_NAME git clone https://github.com/PatrickMurray/AutomataFiddle.git
cd ~;


# Stop the Apache2 service before we begin modifying configuration files
service apache2 stop

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

service apache2 start
