const encoder = new TextEncoder()

const subscribers = new Set<ReadableStreamDefaultController>()

export function addSubscriber(controller: ReadableStreamDefaultController): void {
  subscribers.add(controller)
  console.log(`[SSE] Subscriber connected (total: ${subscribers.size})`)
}

export function removeSubscriber(controller: ReadableStreamDefaultController): void {
  subscribers.delete(controller)
  console.log(`[SSE] Subscriber disconnected (total: ${subscribers.size})`)
}

export function getSubscriberCount(): number {
  return subscribers.size
}

export function broadcast(payload: Record<string, unknown>): void {
  const message = `data: ${JSON.stringify(payload)}\n\n`
  const encoded = encoder.encode(message)

  for (const controller of subscribers) {
    try {
      controller.enqueue(encoded)
    } catch (err) {
      console.error('[SSE] Failed to send to subscriber:', err)
      subscribers.delete(controller)
    }
  }
}

export function sendToController(controller: ReadableStreamDefaultController, data: string): void {
  controller.enqueue(encoder.encode(data))
}
