import PocketBase from 'pocketbase'

declare global {
  interface Window {
    __ENV__?: { PB_URL?: string }
  }
}

// In dev:  empty string routes through the Vite proxy (no CORS needed).
// In prod: window.__ENV__.PB_URL is written by docker-entrypoint.sh at startup.
const pbUrl = window.__ENV__?.PB_URL || import.meta.env.VITE_PB_URL || '/'

const pb = new PocketBase(pbUrl)

pb.autoCancellation(false)

export default pb
