import PocketBase from 'pocketbase'

// In dev, use empty string to route through Vite proxy (avoids CORS).
// In prod, set VITE_PB_URL to the PocketBase server URL.
const pb = new PocketBase(import.meta.env.VITE_PB_URL || '/')

pb.autoCancellation(false)

export default pb
