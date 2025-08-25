// Notification Worker for Find Five V2
// Handles background notifications and user interactions

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { payload } = event.data
    showNotification(payload)
  }
})

// Show notification with options
async function showNotification(payload) {
  const { 
    title, 
    body, 
    icon = '/icon-192x192.svg',
    badge = '/icon-192x192.svg',
    tag = 'find-five',
    requireInteraction = false,
    actions = [],
    data = {},
    silent = false,
    vibrate = [200, 100, 200]
  } = payload

  const options = {
    body,
    icon,
    badge,
    tag,
    requireInteraction,
    actions,
    data,
    silent,
    vibrate,
    timestamp: Date.now()
  }

  try {
    await self.registration.showNotification(title, options)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  // Handle different actions
  if (action === 'log') {
    // Open the app to log entries
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (action === 'snooze') {
    // Send message to snooze notifications
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (const client of windowClients) {
          client.postMessage({
            type: 'SNOOZE_NOTIFICATION',
            minutes: 10
          })
        }
      })
    )
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  
  // Track notification dismissal
  if (data.type === 'scheduled_reminder') {
    // Could send analytics here
    console.log('Scheduled reminder dismissed')
  }
})

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    // Check if we have queued notifications to send
    const cache = await caches.open('notification-queue')
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const payload = await response.json()
        await showNotification(payload)
        await cache.delete(request)
      }
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error)
  }
}

// Periodic background sync for scheduled notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkAndSendScheduledNotifications())
  }
})

async function checkAndSendScheduledNotifications() {
  try {
    // Get stored schedule from IndexedDB or cache
    const db = await openDB()
    const schedule = await getSchedule(db)
    
    if (schedule && schedule.nextNotificationTime) {
      const now = new Date()
      const nextTime = new Date(schedule.nextNotificationTime)
      
      if (now >= nextTime) {
        // Time to send a notification
        await showNotification({
          title: '⏰ Find Five Reminder',
          body: "Time to log your activities! What have you been working on?",
          requireInteraction: true,
          actions: [
            { action: 'log', title: 'Log Now' },
            { action: 'snooze', title: 'Snooze 10min' }
          ],
          data: { type: 'scheduled_reminder' }
        })
        
        // Update schedule for next notification
        await updateSchedule(db, schedule)
      }
    }
  } catch (error) {
    console.error('Failed to check scheduled notifications:', error)
  }
}

// Simple IndexedDB helpers for notification scheduling
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('find-five-notifications', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('schedule')) {
        db.createObjectStore('schedule', { keyPath: 'id' })
      }
    }
  })
}

function getSchedule(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['schedule'], 'readonly')
    const store = transaction.objectStore('schedule')
    const request = store.get('main')
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function updateSchedule(db, schedule) {
  return new Promise((resolve, reject) => {
    // Calculate next notification time based on interval
    const interval = schedule.currentInterval || 30 // Default 30 minutes
    const nextTime = new Date()
    nextTime.setMinutes(nextTime.getMinutes() + interval)
    
    schedule.nextNotificationTime = nextTime.toISOString()
    schedule.lastNotificationTime = new Date().toISOString()
    schedule.notificationCount = (schedule.notificationCount || 0) + 1
    
    const transaction = db.transaction(['schedule'], 'readwrite')
    const store = transaction.objectStore('schedule')
    const request = store.put(schedule)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Listen for push notifications (for future Web Push implementation)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  event.waitUntil(
    showNotification({
      title: data.title || '📢 Find Five Update',
      body: data.body || 'You have a new notification',
      data: data.data || {}
    })
  )
})

console.log('Find Five notification worker loaded')