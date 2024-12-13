# OVH DynHost Sync

This repository provides a tool to synchronize your DynHost configurations with your current IPv4 address.

## Setup

1. Ensure `config.json` exists in the root directory. If not, create it with the following content:

    ```json
    {
      "domains": [],
      "interval": 5
    }
    ```

2. Configure your domains in the application. Each domain should include the subdomain (e.g., `subdomain.example.com`).
3. Provide the necessary OVH credentials through the web interface.
4. Use the "Save Configurations" button to save your settings without performing an immediate update.
5. The application will automatically update the DynHost configurations at the specified intervals.

## Usage

- Access the web interface to add or remove domain configurations.
- The application fetches your current IPv4 address and updates the DynHost settings accordingly.
- Configurations are saved to `config.json` and persisted across restarts.
- On page load, the application retrieves saved configurations and populates the form.
- Use the "Update DynHost" button to immediately update DynHost configurations with the current IP.
- Use the "Save Configurations" button to save changes without updating DynHost.
