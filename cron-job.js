const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs'); // Import fs module

const fetchCurrentIp = async () => {
  try {
    const response = await axios.get('https://api4.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    return null;
  }
};

const getOvhCurrentIp = async (domain, username, password) => {
  try {
    const url = `https://www.ovh.com/nic/update?system=dyndns&hostname=${domain}`;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    // OVH returns "nochg CURRENT_IP" when no change is needed
    const match = response.data.match(/nochg\s+(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error(`Failed to fetch OVH IP for ${domain}:`, error.message);
    return null;
  }
};

const updateDynHostConfig = async (domain, ip, username, password) => {
  try {
    // First, get current IP from OVH
    const ovhIp = await getOvhCurrentIp(domain, username, password);
    
    if (ovhIp === ip) {
      console.log(`Skipping update for ${domain} - Current IP ${ip} matches OVH IP`);
      return;
    }

    const url = `https://www.ovh.com/nic/update?system=dyndns&hostname=${domain}&myip=${ip}`;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    console.log(`DynHost configuration updated successfully - Domain: ${domain}, IP changed from ${ovhIp} to ${ip}`);
  } catch (error) {
    console.error(`Failed to update DynHost configuration - Domain: ${domain}, IP: ${ip}, Error:`, error.message);
  }
};

const checkAndUpdateIp = async () => {
  const currentIp = await fetchCurrentIp();
  if (!currentIp) return;

  console.log(`Starting DynHost updates check with IP: ${currentIp}`);
  
  // Read the latest config.json
  fs.readFile('./config.json', 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading config.json:', err);
      return;
    }
    try {
      const config = JSON.parse(data);
      for (const domainConfig of config.domains) {
        const { domain, username, password } = domainConfig;
        await updateDynHostConfig(domain, currentIp, username, password);
      }
    } catch (parseError) {
      console.error('Error parsing config.json:', parseError);
    }
  });
};

// Read the configuration to get the interval
let config = { interval: 5 }; // Default interval
try {
  const data = fs.readFileSync('./config.json', 'utf8');
  config = JSON.parse(data);
} catch (error) {
  console.error('Error reading config.json:', error);
}

// Schedule the cron job with the interval from config
cron.schedule(`*/${config.interval} * * * *`, checkAndUpdateIp);

module.exports = {
  fetchCurrentIp,
  updateDynHostConfig
};
