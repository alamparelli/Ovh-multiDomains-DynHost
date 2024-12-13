const express = require('express');
const fs = require('fs'); // Import fs module
const app = express();
const { fetchCurrentIp, updateDynHostConfig } = require('./cron-job');

app.use(express.json());
app.use(express.static('public'));

app.get('/api/ip', async (req, res) => {
  const ip = await fetchCurrentIp();
  if (ip) {
    res.json({ ip });
  } else {
    res.status(500).json({ error: 'Failed to fetch IP address' });
  }
});

// Endpoint to get configurations
app.get('/api/config', (req, res) => {
  fs.readFile('./config.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading config.json:', err);
      return res.status(500).json({ error: 'Failed to read configurations' });
    }
    try {
      const config = JSON.parse(data);
      res.json(config);
    } catch (parseError) {
      console.error('Error parsing config.json:', parseError);
      res.status(500).json({ error: 'Failed to parse configurations' });
    }
  });
});

// Endpoint to save configurations without updating DynHost
app.post('/api/config', (req, res) => {
  const { domains } = req.body;

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({ error: 'Invalid domains data' });
  }

  fs.writeFile('./config.json', JSON.stringify({ domains, interval: 5 }, null, 2), (err) => {
    if (err) {
      console.error('Error writing to config.json:', err);
      return res.status(500).json({ error: 'Failed to save configurations' });
    }
    res.json({ message: 'Configurations saved successfully' });
  });
});

app.post('/api/update', async (req, res) => {
  const { domains } = req.body;

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({ error: 'Invalid domains data' });
  }

  try {
    for (const domainConfig of domains) {
      const { domain, username, password } = domainConfig;
      const currentIp = await fetchCurrentIp();
      if (!currentIp) {
        return res.status(500).json({ error: 'Failed to fetch current IP address' });
      }
      await updateDynHostConfig(domain, currentIp, username, password);
    }

    // Save configurations to config.json
    fs.writeFile('./config.json', JSON.stringify({ domains, interval: 5 }, null, 2), (err) => {
      if (err) {
        console.error('Error writing to config.json:', err);
        return res.status(500).json({ error: 'Failed to save configurations' });
      }
      res.json({ message: 'DynHost configurations updated successfully' });
    });
  } catch (error) {
    console.error('Error updating DynHost configurations:', error);
    res.status(500).json({ error: 'Failed to update DynHost configurations' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
