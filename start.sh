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

[agent.session]
backend = "sqlite"
strategy = "per-sender"
ttl_seconds = 86400
max_messages = 100

[memory]
backend = "sqlite"
auto_save = true

[skills]
open_skills_enabled = true
allow_scripts = false
prompt_injection_mode = "full"

[web_search]
enabled = true
provider = "tavily"
api_key = "${TAVILY_API_KEY:-}"
fallback_providers = ["duckduckgo"]
max_results = 5

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
    # Update Tavily API key from env var if set
    if [ -n "$TAVILY_API_KEY" ]; then
        sed -i "s|^api_key = \"tvly-.*\"|api_key = \"${TAVILY_API_KEY}\"|" "$CONFIG_FILE"
    fi
    # Add [agent.session] config if not present (enables persistent sessions)
    if ! grep -q "\[agent.session\]" "$CONFIG_FILE"; then
        cat >> "$CONFIG_FILE" <<TOML

[agent.session]
backend = "sqlite"
strategy = "per-sender"
ttl_seconds = 86400
max_messages = 100

[memory]
backend = "sqlite"
auto_save = true
TOML
        echo "Session persistence (sqlite) added to config."
    fi

    # Add [skills] config if not present
    if ! grep -q "\[skills\]" "$CONFIG_FILE"; then
        cat >> "$CONFIG_FILE" <<TOML

[skills]
open_skills_enabled = true
allow_scripts = false
prompt_injection_mode = "full"
TOML
        echo "Skills config added."
    fi

    # Add [web_search] config if not present
    if ! grep -q "\[web_search\]" "$CONFIG_FILE"; then
        cat >> "$CONFIG_FILE" <<TOML

[web_search]
enabled = true
provider = "tavily"
api_key = "${TAVILY_API_KEY:-}"
fallback_providers = ["duckduckgo"]
max_results = 5
TOML
        echo "Web search (tavily) added to config."
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

# Install Chromium for agent-browser (one-time, persisted on /data volume)
PLAYWRIGHT_CACHE="/data/.cache/ms-playwright"
if [ ! -d "$PLAYWRIGHT_CACHE" ]; then
    echo "Downloading browser binaries for agent-browser (first boot, ~200MB)..."
    agent-browser install 2>&1 | tail -10 || echo "Warning: agent-browser install failed, browser automation may not work"
else
    echo "Browser binaries already installed, skipping download."
fi

echo "Starting ZeroClaw daemon..."
exec zeroclaw daemon
