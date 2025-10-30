#!/bin/bash
set -e

echo "🔧 Checking dependencies..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing..."
    sudo apt update -y
    sudo apt install -y nodejs
else
    echo "✅ Node.js is already installed."
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "📦 npm not found. Installing..."
    sudo apt update -y
    sudo apt install -y npm
else
    echo "✅ npm is already installed."
fi

echo "📦 Installing WakeOnWeb dependencies..."
npm install

# Detect the directory where this script is located
SCRIPT_DIR=$(dirname "$(realpath "$0")")
SERVER_FILE="$SCRIPT_DIR/src/server.js"
SERVICE_FILE="/etc/systemd/system/wakeonweb.service"

# Check if server.js exists
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Error: server.js not found in $SCRIPT_DIR/src/"
    echo "Please make sure you have downloaded the repository correctly."
    exit 1
fi

update_service() {
    echo "🛠️  Creating/updating systemd service file..."
    cat <<EOF | sudo tee "$SERVICE_FILE"
[Unit]
Description=WakeOnWeb Service
After=network.target

[Service]
ExecStart=/usr/bin/node $SERVER_FILE
WorkingDirectory=$SCRIPT_DIR
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable wakeonweb
    sudo systemctl restart wakeonweb
}

# Check if service already exists
if [ -f "$SERVICE_FILE" ]; then
    # Check if ExecStart points to the correct SERVER_FILE
    CURRENT_PATH=$(grep ExecStart "$SERVICE_FILE" | awk '{print $2}')
    if [[ "$CURRENT_PATH" != "$SERVER_FILE" ]]; then
        echo "⚠️  Existing service points to a different path. Updating..."
        update_service
    else
        echo "✅ Service already exists and points to the correct path. Restarting..."
        sudo systemctl restart wakeonweb
    fi
else
    update_service
fi

# Show the access URL
ip=$(hostname -I | awk '{print $1}')
echo "✅ WakeOnWeb is running at http://$ip:8093"
