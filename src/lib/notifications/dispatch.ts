export interface ChannelResult {
  channel: 'email' | 'whatsapp'
  success: boolean
  error?: string
}

export async function dispatch(
  sends: Array<{
    channel: 'email' | 'whatsapp'
    send: () => Promise<{ success: boolean; error?: string }>
  }>
): Promise<ChannelResult[]> {
  const results = await Promise.allSettled(sends.map(s => s.send()))
  return results.map((r, i) => {
    const channel = sends[i].channel
    if (r.status === 'fulfilled') {
      if (!r.value.success) {
        console.error(`[notify] ${channel} send failed:`, r.value.error)
      }
      return { channel, success: r.value.success, error: r.value.error }
    }
    console.error(`[notify] ${channel} send threw:`, r.reason)
    return { channel, success: false, error: String(r.reason) }
  })
}
