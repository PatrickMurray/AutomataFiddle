#! /usr/bin/env bash


USER_NAME="www-data"
USER_HOME="/var"
APACHE_GROUP="www-data"


if [ $EUID -ne 0 ] ; then
	echo "The web server setup script must be run as root."
	exit 1
fi


# Add the Debian Jessie backports to install Lets Encrypt and CertBot which are
# currently in a public beta.
echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list


# Update package list and upgrade all installed packages
apt-get update
apt-get upgrade -y


# Install Fail2Ban, Apache, PHP, MySQL Interface, Git, and GraphViz
apt-get install sudo fail2ban apache2 php5 libapache2-mod-php5 php5-mysql php5-mcrypt php5-apcu git graphviz -y


# Stop the Apache2 service before we continue
service apache2 stop


# Install Let Encrypt and CertBot
apt-get install python-certbot-apache -t jessie-backports -y


# Launch the CertBot setup wizard and feed in the "certonly" parameter which
# forces CertBot to create certificates only (not touching the apache virtual
# hosts)
certbot --apache certonly


# Grant www-data permission to use Git and modify the Apache service
echo "git        ALL = ($USER_NAME) /usr/bin/git"         >> /etc/sudoers
echo "$USER_NAME ALL = NOPASSWD:    /etc/init.d/apache2" >> /etc/sudoers

# Grant www-data permission to modify /var
chgrp -R $APACHE_GROUP $USER_HOME
chmod -R g+w $USER_HOME
chmod    g+s $USER_HOME


# Remove the git repository if it exists, and clone it again.
cd $USER_HOME;
if [ -d $USER_NAME ] ; then
	sudo -u $USER_NAME rm -rf AutomataFiddle
fi


# Clone the repository as the www-data user
sudo -u $USER_NAME git clone https://github.com/PatrickMurray/AutomataFiddle.git
cd ~;


# Create systemd service and timer files
if [ -f /etc/systemd/system/automatafiddle-ssl-renew.timer ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.timer;
fi

if [ -f /etc/systemd/system/automatafiddle-ssl-renew.service ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.service;
fi


mv $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/system/automatafiddle-ssl-renew.timer /etc/systemd/system/automatafiddle-ssl-renew.timer
mv $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/system/automatafiddle-ssl-renew.service /etc/systemd/system/automatafiddle-ssl-renew.service

chmod +x $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/services/automatafiddle-ssl-renew.sh


# Enabling the auto-renew service
systemctl start  automatafiddle-ssl-renew.timer
systemctl enable automatafiddle-ssl-renew.timer




# Set up the Apache configuration and virtual hosts
if [ -f /etc/apache2/apache2.conf ] ; then
	rm /etc/apache2/apache2.conf;
fi

if [ -f /etc/apache2/sites-enabled/000-default.conf ] ; then
	rm /etc/apache2/sites-enabled/000-default.conf;
fi

if [ -f /etc/apache2/sites-enabled/www-automatafiddle-com.conf ] ; then
	rm /etc/apache2/sites-enabled/www-automatafiddle-com.conf;
fi

if [ -f /etc/apache2/sites-enabled/www-automatafiddle-com-ssl.conf ] ; then
	rm /etc/apache2/sites-enabled/www-automatafiddle-com-ssl.conf;
fi

if [ -f /etc/apache2/sites-enabled/api-automatafiddle-com.conf ] ; then
	rm /etc/apache2/sites-enabled/api-automatafiddle-com.conf;
fi

if [ -f /etc/apache2/sites-enabled/api-automatafiddle-com-ssl.conf ] ; then
	rm /etc/apache2/sites-enabled/api-automatafiddle-com-ssl.conf;
fi

if [ -f /etc/apache2/sites-enabled/cdn-automatafiddle-com.conf ] ; then
	rm /etc/apache2/sites-enabled/cdn-automatafiddle-com.conf;
fi

if [ -f /etc/apache2/sites-enabled/cdn-automatafiddle-com-ssl.conf ] ; then
	rm /etc/apache2/sites-enabled/cdn-automatafiddle-com-ssl.conf;
fi

ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/apache2.conf /etc/apache2/apache2.conf

ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/www-automatafiddle-com.conf     /etc/apache2/sites-enabled/www-automatafiddle-com.conf
ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/www-automatafiddle-com-ssl.conf /etc/apache2/sites-enabled/www-automatafiddle-com-ssl.conf

ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/api-automatafiddle-com.conf     /etc/apache2/sites-enabled/api-automatafiddle-com.conf
ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/api-automatafiddle-com-ssl.conf /etc/apache2/sites-enabled/api-automatafiddle-com-ssl.conf

ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/cdn-automatafiddle-com.conf     /etc/apache2/sites-enabled/cdn-automatafiddle-com.conf
ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/sites-enabled/cdn-automatafiddle-com-ssl.conf /etc/apache2/sites-enabled/cdn-automatafiddle-com-ssl.conf


# Enable the apache modules rewrite and ssl
a2enmod rewrite
a2enmod ssl


# Start the apache service back up
service apache2 start
