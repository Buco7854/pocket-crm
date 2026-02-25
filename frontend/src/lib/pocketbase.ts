import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090')

pb.autoCancellation(false)

// 401 interceptor — redirect to login on expired/invalid token
pb.afterSend = function (_response, data) {
  if (_response.status === 401 && pb.authStore.isValid) {
    pb.authStore.clear()
    window.location.href = '/login'
  }
  return data
}

export default pb
