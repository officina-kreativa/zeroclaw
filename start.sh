#!/bin/bash
set -e

# Ensure directories exist on persistent volume
mkdir -p /data/.zeroclaw /data/.zeroclaw/logs /data/workspace

CONFIG_FILE="/data/.zeroclaw/config.toml"

# Create default config if not present (first boot)
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Creating default config for Ollama cloud..."
    cat > "$CONFIG_FILE" <<TOML
workspace_dir = "/data/workspace"
config_path = "/data/.zeroclaw/config.toml"
api_key = "${API_KEY:-}"
api_url = "https://ollama.com"
default_provider = "ollama"
default_model = "qwen3-coder-next:cloud"
default_temperature = 0.7

[gateway]
port = 8080
host = "0.0.0.0"
allow_public_bind = true
TOML
    echo "Config created at $CONFIG_FILE"
else
    echo "Config already exists, preserving existing configuration."
    # Update API_KEY from env var if set (allows changing key without losing config)
    if [ -n "$API_KEY" ]; then
        sed -i "s|^api_key = .*|api_key = \"${API_KEY}\"|" "$CONFIG_FILE"
    fi
fi

echo "Starting ZeroClaw daemon..."
exec zeroclaw daemon
