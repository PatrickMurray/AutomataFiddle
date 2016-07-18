# /usr/bin/env bash


USER_NAME="www-data"
USER_HOME="/var"
APACHE_GROUP="www-data"


if [ $EUID -ne 0 ] ; then
	echo "The web server setup script must be run as root."
	exit -1
fi


# Add the Debian Jessie backports to install Lets Encrypt and CertBot which are
# currently in a public beta.
if [ echo "deb http://ftp.debian.org/debian jessie-backports main" >> /etc/apt/sources.list ] ; then
	echo "Successfully added backport to sources.list..."
else
	echo "Failed to add backport to sources.list!"
	exit -1
fi


# Update package list and upgrade all installed packages
if [ apt-get update && apt-get upgrade -y ] ; then
	echo "Successfully updated and upgraded packages..."
else
	echo ""
	exit -1
fi


# Install Fail2Ban, Apache, PHP, MySQL Interface, Git, and GraphViz
if [ apt-get -y install sudo fail2ban apache2 php5 libapache2-mod-php5 php5-mysql php5-mcrypt php5-apcu git graphviz ] ; then
	echo "Successfully installed core utilities..."
else
	echo "Failed to install core utilities!"
	exit -1
fi

# Stop the Apache2 service before we continue
if [ service apache2 stop ] ; then
	echo "Successfully stopped apache..."
else
	echo "Failed to stop apache!"
	exit -1
fi


# Install Let Encrypt and CertBot
if [ apt-get install -y -t jessie-backports python-certbot-apache ] ; then
	echo "Successfully installed certbot from backports..."
else
	echo "Failed to install certbot from the backports!"
	exit -1
fi


# Launch the CertBot setup wizard and feed in the "certonly" parameter which
# forces CertBot to create certificates only (not touching the apache virtual
# hosts)
if [ certbot --apache certonly ] ; then
	echo "Successfully set up certbot..."
else
	echo "Failed to set up certbot!"
	exit -1
fi


# Grant www-data permission to use Git and modify the Apache service
if [ echo "git ALL = ($USER_NAME) /usr/bin/git\n$USER_NAME ALL = NOPASSWD: /etc/init.d/apache2" >> /etc/sudoers ] ; then
	echo "Successfully granted www-data permission to git and service..."
else
	echo "Failed to grant www-data permission to modify git and service!"
	exit -1
fi

# Grant www-data permission to modify /var
if [ chgrp -R $APACHE_GROUP $USER_HOME && chmod -R g+w $USER_HOME && chmod g+s $USER_HOME ] ; then
	echo "Successfully granted www-data access to $USER_HOME..."
else
	echo "Failed to grant www-data permission to access $USER_HOME!"
	exit -1
fi


# Remove the git repository if it exists, and clone it again.
cd $USER_HOME;
if [ -d $USER_NAME ] ; then
	sudo -u $USER_NAME rm -rf AutomataFiddle
fi


# Clone the repository as the www-data user
if [ sudo -u $USER_NAME git clone https://github.com/PatrickMurray/AutomataFiddle.git ] ; then
	echo "Successfully cloned the git repository..."
else
	echo "Failed to clone the git repository!"
	exit -1
fi
cd ~;


# Create systemd service and timer files
if [ -f /etc/systemd/system/automatafiddle-ssl-renew.timer ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.timer;
fi

if [ -f /etc/systemd/system/automatafiddle-ssl-renew.service ] ; then
	rm /etc/systemd/system/automatafiddle-ssl-renew.service;
fi


if [ mv $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/system/automatafiddle-ssl-renew.timer /etc/systemd/system/automatafiddle-ssl-renew.timer ] ; then
	echo "Successfully moved the ssl renewal timer..."
else
	echo "Failed to move ssl renewal timer!"
	exit -1
fi

if [ mv $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/system/automatafiddle-ssl-renew.service /etc/systemd/system/automatafiddle-ssl-renew.service ] ; then
	echo "Successfully moved the ssl renewal service..."
else
	echo "Failed to move the ssl renewal service!"
	exit -1
fi

if [ chmod +x $USER_HOME/AutomataFiddle/AutomataFiddle/config/systemd/services/automatafiddle-ssl-renew.sh ] ; then
	echo "Successfully marked the ssh renewal script as executable..."
else
	echo "Failed to mark the ssh renewal script as executable!"
	exit -1
fi

# Enabling the auto-renew service
if [ systemctl start automatafiddle-ssl-renew.timer ] ; then
	echo "Successfully started the systemd ssl renewal timer..."
else
	echo "Failed to start the systemd ssl renewal timer!"
	exit -1
fi

if [ systemctl enable automatafiddle-ssl-renew.timer ] ; then
	echo "Successfully enabled the systemd ssl renewal timer..."
else
	echo "Failed to enable the systemd ssl renewal timer!"
	exit -1
fi




# Set up the Apache configuration and virtual hosts
#if [ -f /etc/apache2/apache2.conf ] ; then
#	rm /etc/apache2/apache2.conf;
#fi

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

#ln -s $USER_HOME/AutomataFiddle/AutomataFiddle/config/apache2/apache2.conf /etc/apache2/apache2.conf

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
