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

[channels_config.telegram]
bot_token = "${TELEGRAM_BOT_TOKEN:-}"
allowed_users = ["vinscyber"]

[[channels]]
channel_type = "telegram"
TOML
    echo "Config created at $CONFIG_FILE"
else
    echo "Config already exists, preserving existing configuration."
    # Update API_KEY from env var if set
    if [ -n "$API_KEY" ]; then
        sed -i "s|^api_key = .*|api_key = \"${API_KEY}\"|" "$CONFIG_FILE"
    fi
    # Update Telegram bot token from env var if set
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        sed -i "s|^bot_token = .*|bot_token = \"${TELEGRAM_BOT_TOKEN}\"|" "$CONFIG_FILE"
    fi
    # Add Telegram config if not present
    if ! grep -q "channels_config.telegram" "$CONFIG_FILE"; then
        cat >> "$CONFIG_FILE" <<TOML

[channels_config.telegram]
bot_token = "${TELEGRAM_BOT_TOKEN:-}"
allowed_users = ["vinscyber"]

[[channels]]
channel_type = "telegram"
TOML
        echo "Telegram channel added to config."
    fi
fi

echo "Starting ZeroClaw daemon..."
exec zeroclaw daemon
