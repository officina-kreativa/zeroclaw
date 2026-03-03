#!/bin/bash
set -e

# Ensure directories exist on persistent volume
mkdir -p /data/.zeroclaw /data/.zeroclaw/logs /data/workspace

CONFIG_FILE="/data/.zeroclaw/config.toml"

# Detect corrupted config (bad [agent] block left orphaned TOML array fragments).
# If found, back up and remove so the clean first-boot path recreates it.
# Sessions and memory live in separate SQLite files — config.toml is safe to recreate.
if [ -f "$CONFIG_FILE" ] && { grep -qE '^\["web_search"|^\["file_read"' "$CONFIG_FILE" || ! grep -q 'cli = true' "$CONFIG_FILE"; }; then
    BACKUP="${CONFIG_FILE}.bak.$(date +%s)"
    cp "$CONFIG_FILE" "$BACKUP"
    rm "$CONFIG_FILE"
    echo "Corrupted config detected and backed up to $BACKUP — recreating..."
fi

# Create default config if not present (first boot or after corruption recovery)
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

[agent]
agentic = true
allowed_tools = ["web_search", "file_read", "shell"]
max_iterations = 5

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

[research]
enabled = true
trigger = "keywords"
keywords = ["search", "find", "cerca", "cerca su", "look up", "what is", "who is", "how is", "when is", "latest", "news"]
max_iterations = 3
show_progress = true

[channels_config]
cli = true

[channels_config.telegram]
bot_token = "${TELEGRAM_BOT_TOKEN:-}"
allowed_users = ["vinscyber"]

[[channels]]
channel_type = "telegram"
TOML
    echo "Config created at $CONFIG_FILE"
else
    echo "Config already exists, preserving existing configuration."

    # Update secrets from env vars
    if [ -n "$API_KEY" ]; then
        sed -i "s|^api_key = .*|api_key = \"${API_KEY}\"|" "$CONFIG_FILE"
    fi
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        sed -i "s|^bot_token = .*|bot_token = \"${TELEGRAM_BOT_TOKEN}\"|" "$CONFIG_FILE"
    fi
    if [ -n "$TAVILY_API_KEY" ]; then
        sed -i "s|^api_key = \"tvly-[^\"]*\"|api_key = \"${TAVILY_API_KEY}\"|" "$CONFIG_FILE"
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
