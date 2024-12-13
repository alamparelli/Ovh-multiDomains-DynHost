document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dynhost-form');
  const statusDiv = document.getElementById('status');
  const currentIpDiv = document.getElementById('current-ip');
  const addDomainButton = document.getElementById('add-domain');
  const domainsContainer = document.getElementById('domains-container');
  const saveConfigButton = document.getElementById('save-config');

  // Function to add a new domain input group
  const createDomainGroup = (domainConfig = {}) => {
    const domainGroup = document.createElement('div');
    domainGroup.classList.add('domain-group');
    domainGroup.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-globe"></i> Domain</label>
        <input type="text" class="form-control" name="domain" placeholder="example.domain.com" required value="${domainConfig.domain || ''}">
      </div>
      <div class="form-group">
        <label><i class="fas fa-user"></i> Username</label>
        <input type="text" class="form-control" name="username" placeholder="OVH DynHost username" required value="${domainConfig.username || ''}">
      </div>
      <div class="form-group">
        <label><i class="fas fa-key"></i> Password</label>
        <div class="input-group">
          <input type="password" class="form-control" name="password" required value="${domainConfig.password || ''}">
          <button type="button" class="btn toggle-password" title="Show/Hide Password">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      <button type="button" class="btn remove-domain" title="Remove Domain">
        <i class="fas fa-trash"></i>
      </button>
    `;
    return domainGroup;
  };

  addDomainButton.addEventListener('click', () => {
    const domainGroup = createDomainGroup();
    domainsContainer.appendChild(domainGroup);
    
    // Add fade-in animation
    requestAnimationFrame(() => {
      domainGroup.style.opacity = '0';
      domainGroup.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        domainGroup.style.transition = 'all 0.3s ease';
        domainGroup.style.opacity = '1';
        domainGroup.style.transform = 'translateY(0)';
      });
    });

    // Add password toggle functionality
    const toggleBtn = domainGroup.querySelector('.toggle-password');
    const passwordInput = domainGroup.querySelector('input[name="password"]');
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  });

  // Function to remove a domain input group
  domainsContainer.addEventListener('click', (e) => {
    const removeButton = e.target.closest('.remove-domain');
    if (!removeButton) return;

    const domainGroup = removeButton.closest('.domain-group');
    const domainInput = domainGroup.querySelector('input[name="domain"]');
    const domainName = domainInput.value || 'this domain';

    if (confirm(`Are you sure you want to remove ${domainName}?`)) {
      domainGroup.style.transform = 'scale(0.95)';
      domainGroup.style.opacity = '0';
      
      setTimeout(() => {
        domainGroup.remove();
        showStatus(`Domain "${domainName}" removed`, 'info');
      }, 300);
    }
  });

  // Handle form submission to update DynHost configurations
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const domainGroups = document.querySelectorAll('.domain-group');
    const domains = [];

    domainGroups.forEach(group => {
      const domain = group.querySelector('input[name="domain"]').value;
      const username = group.querySelector('input[name="username"]').value;
      const password = group.querySelector('input[name="password"]').value;

      domains.push({ domain, username, password });
    });

    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains })
      });

      const result = await response.json();

      if (response.ok) {
        showStatus(result.message, 'success');
        displayCurrentIp(); // Refresh the displayed IP
      } else {
        showStatus(result.error, 'danger');
      }
    } catch (error) {
      console.error('Error updating DynHost:', error);
      showStatus('An error occurred while updating DynHost.', 'danger');
    }
  });

  async function fetchCurrentIp() {
    try {
      const response = await fetch('/api/ip');
      const result = await response.json();
      currentIpDiv.textContent = `Current IP: ${result.ip}`;
    } catch (error) {
      currentIpDiv.textContent = 'Failed to fetch current IP address';
    }
  }

  // Update status message display
  function showStatus(message, type) {
    statusDiv.className = `alert alert-${type} d-block`;
    statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => {
      statusDiv.classList.add('d-none');
    }, 5000);
  }

  // Fetch and display the current IPv4 address
  async function displayCurrentIp() {
    try {
      const response = await fetch('/api/ip');
      const data = await response.json();
      if (data.ip) {
        document.getElementById('current-ip').innerHTML = `
          <i class="fas fa-network-wired"></i> Current IPv4: <strong>${data.ip}</strong>
        `;
      } else {
        document.getElementById('current-ip').innerHTML = `
          <i class="fas fa-exclamation-triangle"></i> Failed to retrieve IPv4 address.
        `;
      }
    } catch (error) {
      console.error('Error fetching IP:', error);
      document.getElementById('current-ip').innerHTML = `
        <i class="fas fa-exclamation-circle"></i> Error fetching IPv4 address.
      `;
    }
  }

  // Function to load configurations and populate the form
  async function loadConfigurations() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();

      if (config.domains && Array.isArray(config.domains)) {
        // Clear existing domain groups
        domainsContainer.innerHTML = '';

        config.domains.forEach((domainConfig) => {
          const domainGroup = createDomainGroup(domainConfig);
          domainsContainer.appendChild(domainGroup);
        });
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  }

  // Handle "Save Configurations" button click
  saveConfigButton.addEventListener('click', async () => {
    const domainGroups = document.querySelectorAll('.domain-group');
    const domains = [];

    domainGroups.forEach(group => {
      const domain = group.querySelector('input[name="domain"]').value;
      const username = group.querySelector('input[name="username"]').value;
      const password = group.querySelector('input[name="password"]').value;

      domains.push({ domain, username, password });
    });

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains })
      });

      const result = await response.json();

      if (response.ok) {
        showStatus(result.message, 'success');
      } else {
        showStatus(result.error, 'danger');
      }
    } catch (error) {
      console.error('Error saving configurations:', error);
      showStatus('An error occurred while saving configurations.', 'danger');
    }
  });

  // Initialize the page by loading configurations and displaying the current IP
  loadConfigurations();
  displayCurrentIp();
});
