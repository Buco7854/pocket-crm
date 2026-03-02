#!/bin/sh
set -e

# Write runtime environment variables into env.js before nginx starts.
# Add variables here as needed (e.g. PB_URL, FEATURE_FLAGS, etc.)
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  PB_URL: "${PB_URL:-/}"
};
EOF

exec nginx -g 'daemon off;'
