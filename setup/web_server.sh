#! /usr/bin/env bash

USER_NAME = "automatafiddle"
USER_HOME = "/var/www"
APCH_GRUP = "www-data"

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
adduser $USER_NAME --home $USER_HOME --ingroup $APCH_GRUP
chgrp -R $APCH_GRUP $USER_HOME
chmod -R g+w $USER_HOME
chmod g+s $USER_HOME


# Setup Git
cd $USER_HOME;
if [ -d AutomataFiddle ] ; then
	su automatafiddle -c "rm -rf AutomataFiddle"
fi
su automatafiddle -c "git clone https://github.com/PatrickMurray/AutomataFiddle.git"
cd ~;


# Setup Configurations
if [ -f /etc/apache2/sites-enabled/000-default.conf ] ; then
	rm /etc/apache2/sites-enabled/000-default.conf;
fi

if [ -f /etc/apache2/sites-enabled/automatafiddle.conf ] ; then
	rm /etc/apache2/sites-enabled/automatafiddle.conf;
fi

ln -s /var/www/AutomataFiddle/config/apache2/automatafiddle.conf /etc/apache2/sites-enabled/automatafiddle.conf

service apache2 reload
