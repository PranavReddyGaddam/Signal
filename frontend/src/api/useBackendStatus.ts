import { useEffect, useState } from 'react'
import axios from 'axios'

type Status = 'connecting' | 'online' | 'offline'

export function useBackendStatus(): Status {
  const [status, setStatus] = useState<Status>('connecting')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    async function ping() {
      try {
        await axios.get('/api/health', { timeout: 3000 })
        setStatus('online')
      } catch {
        setStatus(prev => prev === 'connecting' ? 'connecting' : 'offline')
      }
      timer = setTimeout(ping, 5000)
    }

    ping()
    return () => clearTimeout(timer)
  }, [])

  return status
}
