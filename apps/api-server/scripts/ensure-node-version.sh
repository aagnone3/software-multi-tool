#!/bin/bash
# Ensure Node.js version is compatible with this project
# Auto-switches using nvm if needed, then runs the provided command
#
# Usage: ./ensure-node-version.sh <command> [args...]
# Example: ./ensure-node-version.sh tsx watch src/index.ts

REQUIRED_VERSION=22

# Get current Node.js major version
get_node_major_version() {
    node -v 2>/dev/null | sed 's/v//' | cut -d. -f1
}

# Source nvm if available (without auto-use)
load_nvm() {
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

    # Disable nvm auto-use when sourcing
    export NVM_AUTO_USE=false

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # Source nvm without running nvm_auto
        \. "$NVM_DIR/nvm.sh" --no-use 2>/dev/null || \. "$NVM_DIR/nvm.sh" 2>/dev/null
        return 0
    elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
        \. "/opt/homebrew/opt/nvm/nvm.sh" --no-use 2>/dev/null || \. "/opt/homebrew/opt/nvm/nvm.sh" 2>/dev/null
        return 0
    elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
        \. "/usr/local/opt/nvm/nvm.sh" --no-use 2>/dev/null || \. "/usr/local/opt/nvm/nvm.sh" 2>/dev/null
        return 0
    fi
    return 1
}

CURRENT_VERSION=$(get_node_major_version)

if [ "$CURRENT_VERSION" != "$REQUIRED_VERSION" ]; then
    echo "Node.js v${CURRENT_VERSION} detected, but v${REQUIRED_VERSION} is required."
    echo "Attempting to switch via nvm..."

    if load_nvm; then
        # Try to use the required version
        if nvm use "$REQUIRED_VERSION" 2>/dev/null; then
            echo "Switched to Node.js $(node -v) ✓"
        else
            # Version not installed, try to install it
            echo "Node.js v${REQUIRED_VERSION} not installed. Installing..."
            if nvm install "$REQUIRED_VERSION"; then
                nvm use "$REQUIRED_VERSION"
                echo "Installed and switched to Node.js $(node -v) ✓"
            else
                echo ""
                echo "ERROR: Failed to install Node.js v${REQUIRED_VERSION}"
                echo "Please manually run: nvm install ${REQUIRED_VERSION}"
                exit 1
            fi
        fi
    else
        echo ""
        echo "ERROR: nvm not found. Cannot auto-switch Node.js version."
        echo ""
        echo "Please install nvm or manually switch to Node.js v${REQUIRED_VERSION}:"
        echo "  nvm use ${REQUIRED_VERSION}"
        echo ""
        echo "Or install nvm from: https://github.com/nvm-sh/nvm"
        exit 1
    fi
else
    echo "Node.js v${CURRENT_VERSION} ✓"
fi

# Execute the provided command with remaining arguments
if [ $# -gt 0 ]; then
    exec "$@"
fi
