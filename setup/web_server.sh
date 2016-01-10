#! /usr/bin/env bash

USER_NAME="www-data"
USER_HOME="/var/www"
APCH_GRUP="www-data"

apt-get update
apt-get upgrade -y

# Install Apache, PHP, and Git
apt-get install apache2 php5 libapache2-mod-php5 php5-mysql php5-mcrypt git -y

# Add User
adduser $USER_NAME --home $USER_HOME --ingroup $APCH_GRUP
chgrp -R $APCH_GRUP $USER_HOME
chmod -R g+w $USER_HOME
chmod g+s $USER_HOME


# Setup Git
cd $USER_HOME;
if [ -d $USER_NAME ] ; then
	su $USER_NAME -c "rm -rf AutomataFiddle"
fi
su $USER_NAME -c "git clone https://github.com/PatrickMurray/AutomataFiddle.git"
cd ~;

# Configure Apache
service apache2 stop

# Delete the default Apache configuration
if [ -f /etc/apache2/apache2.conf ] ; then
	rm /etc/apache2/apache2.conf;
fi

if [ -f /etc/apache2/sites-enabled/000-default.conf ] ; then
	rm /etc/apache2/sites-enabled/000-default.conf;
fi

if [ -f /etc/apache2/sites-enabled/automatafiddle.conf ] ; then
	rm /etc/apache2/sites-enabled/automatafiddle.conf;
fi

ln -s /var/www/AutomataFiddle/config/apache2/apache2.conf /etc/apache2/apache2.conf
ln -s /var/www/AutomataFiddle/config/apache2/automatafiddle.conf /etc/apache2/sites-enabled/automatafiddle.conf

a2enmod rewrite

service apache2 start
