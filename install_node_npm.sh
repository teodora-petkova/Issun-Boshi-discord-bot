#maybe a better way?
#Installing an ARM-version of Node has become very easy:
#wget http://node-arm.herokuapp.com/node_latest_armhf.deb 
#sudo dpkg -i node_latest_armhf.deb
#

#1. Update & Upgrade your Pi
sudo apt-get update
sudo apt-get upgrade

#2. Determine which version of Node you need - test on raspberry
#uname -m
#armv6l

#3. Download the NodeJS Binaries
#wget [COPIED LINK HERE]
wget https://nodejs.org/download/release/v11.15.0/node-v11.15.0-linux-armv6l.tar.gz

#4. Extract the file
#tar -xzf node-vXX.XX.X-linux-armvXl.tar.gz
tar -xzf node-v11.15.0-linux-armv6l.tar.gz

#The "-xzf" flag is actually 3 flags combined into one.
#The "-x" flag is to tell the program to "extract". 
#The "-z" flag is to tell the program to use "gunzip" for the extraction as the file is an archive ending in ".gz". 
#And finally the "-f" flag simply just means "perform operation on this file". 

#5. Copy the files to a directory in PATH
#cd node-vXX.XX.X-linux-armvXl/
cd node-v11.15.0-linux-armv6l/
sudo cp -R * /usr/local/

#6. Check
node -v
npm -v

#7. Comment - make it run on reboot:
#multiuser runlevel -> run on boot in /etc/rc.local
#su pi -c 'node /home/pi/discordbot/src/bot.js < /dev/null &'
#or an absolute path to your Node.js-file just to make sure.