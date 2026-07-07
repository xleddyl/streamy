import type { DataConnection } from 'peerjs'
import { Peer } from 'peerjs'

export type QueueItem = {
   id: string
   title: string
   thumbnail: string
}

export type ChatMessage = {
   id: string
   author: string
   text: string
   time: number
   system?: boolean
   own?: boolean
}

type Commands = 'seek' | 'play' | 'pause' | 'rate' | 'add' | 'next' | 'prev' | 'jump' | 'remove'

export type Message =
   | {
        type: 'player'
        command:
           | { type: 'seek'; timestamp: number }
           | { type: 'play'; timestamp: number }
           | { type: 'pause'; timestamp: number }
           | { type: 'rate'; rate: number }
     }
   | {
        type: 'queue'
        command:
           | { type: 'add'; item: QueueItem }
           | { type: 'next' }
           | { type: 'prev' }
           | { type: 'jump'; index: number }
           | { type: 'remove'; index: number }
     }

export type VideoState = {
   currentTime: number
   isPlaying: boolean
   lastCommand: Commands
   isReconnection: boolean
   rate: number

   queueIdx: number
   queue: QueueItem[]
}

// wire protocol between peers: video state, chat and presence travel on the same connection
type WireMessage =
   | { kind: 'state'; state: VideoState }
   | { kind: 'chat'; message: ChatMessage }
   | { kind: 'hello'; name: string }
   | { kind: 'roster'; names: string[] }

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'host-left'

const JOIN_TIMEOUT_MS = 15_000

const defaultVideoState = (): VideoState => ({
   currentTime: 0,
   isPlaying: false,
   lastCommand: 'add',
   isReconnection: false,
   rate: 1,

   queueIdx: -1,
   queue: [],
})

const randomName = () => `guest-${Math.random().toString(36).slice(2, 6)}`

export default defineNuxtPlugin(() => {
   // PeerJS objects are kept out of Vue reactivity on purpose: proxying them breaks nothing
   // today but buys nothing either, and the UI only ever needs the derived state below
   let peerInstance: Peer | undefined
   const connections = new Map<string, DataConnection>()
   const guestNames = new Map<string, string>()
   let joinTimeout: ReturnType<typeof setTimeout> | undefined
   let timeProvider: (() => number) | undefined

   const isHost = useState<boolean>('peer-is-host', () => false)
   const roomId = useState<string>('peer-room-id', () => '')
   const videoState = useState<VideoState>('peer-video-state', defaultVideoState)
   const connectionStatus = useState<ConnectionStatus>('peer-connection-status', () => 'idle')
   const participants = useState<string[]>('peer-participants', () => [])
   const chatMessages = useState<ChatMessage[]>('peer-chat-messages', () => [])
   // how many chat messages the local user has actually seen (drives unread badges)
   const chatReadCount = useState<number>('peer-chat-read-count', () => 0)
   const ownName = useLocalStorage<string>('streamy-name', randomName())

   const create = () => {
      destroy()
      connectionStatus.value = 'connecting'
      peerInstance = new Peer()

      peerInstance.on('error', (error) => {
         // 'peer-unavailable' means the room id does not exist (or the host is gone)
         if (connectionStatus.value !== 'connected' || error.type === 'peer-unavailable') {
            connectionStatus.value = 'error'
         }
      })

      return peerInstance
   }

   const destroy = () => {
      clearTimeout(joinTimeout)
      connections.forEach((conn) => conn.close())
      connections.clear()
      guestNames.clear()

      peerInstance?.destroy()
      peerInstance = undefined

      isHost.value = false
      roomId.value = ''
      connectionStatus.value = 'idle'
      videoState.value = defaultVideoState()
      participants.value = []
      chatMessages.value = []
      chatReadCount.value = 0
   }

   const createRoom = () => {
      const peer = create()

      peer.on('open', (id: string) => {
         isHost.value = true
         roomId.value = id
         connectionStatus.value = 'connected'
         participants.value = [ownName.value]
         peer.on('connection', (connection: DataConnection) => {
            handleConnection(connection)
         })
         navigateTo(`/${id}`)
      })
   }

   const joinRoom = (hostId: string) => {
      const peer = create()

      joinTimeout = setTimeout(() => {
         if (connectionStatus.value === 'connecting') {
            connectionStatus.value = 'error'
         }
      }, JOIN_TIMEOUT_MS)

      peer.on('open', () => {
         isHost.value = false
         roomId.value = hostId
         const connection = peer.connect(hostId, { reliable: true })
         handleConnection(connection)
      })
   }

   const leaveRoom = async () => {
      destroy()
      await navigateTo('/')
   }

   const disconnect = () => {
      destroy()
   }

   const handleConnection = (connection: DataConnection | undefined) => {
      if (!connection) return

      connection.on('open', () => {
         clearTimeout(joinTimeout)
         connections.set(connection.peer, connection)
         connectionStatus.value = 'connected'

         if (isHost.value) {
            // fresh snapshot so late joiners land on the right video at the right second
            send(connection, {
               kind: 'state',
               state: {
                  ...videoState.value,
                  currentTime: timeProvider?.() ?? videoState.value.currentTime,
                  isReconnection: true,
               },
            })
            send(connection, { kind: 'roster', names: rosterNames() })
         } else {
            send(connection, { kind: 'hello', name: ownName.value })
         }
      })

      connection.on('data', (data: unknown) => {
         handleWireMessage(connection, data as WireMessage)
      })

      connection.on('close', () => {
         connections.delete(connection.peer)

         if (isHost.value) {
            const name = guestNames.get(connection.peer)
            guestNames.delete(connection.peer)
            if (name) {
               pushSystemMessage(`${name} left`, { broadcast: true })
               broadcastRoster()
            }
            return
         }

         // for a guest the only connection is the host: the room is gone
         connectionStatus.value = 'host-left'
      })
   }

   const handleWireMessage = (origin: DataConnection, message: WireMessage) => {
      switch (message.kind) {
         case 'state': {
            videoState.value = message.state
            if (isHost.value) {
               broadcast({ kind: 'state', state: videoState.value }, origin.peer)
            }
            break
         }
         case 'chat': {
            chatMessages.value = [...chatMessages.value, { ...message.message, own: false }]
            if (isHost.value) {
               broadcast(message, origin.peer)
            }
            break
         }
         case 'hello': {
            if (!isHost.value) break
            const previous = guestNames.get(origin.peer)
            guestNames.set(origin.peer, message.name)
            if (!previous) {
               pushSystemMessage(`${message.name} joined`, { broadcast: true })
            } else if (previous !== message.name) {
               pushSystemMessage(`${previous} is now ${message.name}`, { broadcast: true })
            }
            broadcastRoster()
            break
         }
         case 'roster': {
            participants.value = message.names
            break
         }
      }
   }

   const send = (connection: DataConnection, message: WireMessage) => {
      connection.send(message)
   }

   const broadcast = (message: WireMessage, exceptPeer?: string) => {
      connections.forEach((connection, peerId) => {
         if (peerId === exceptPeer) return
         connection.send(message)
      })
   }

   const rosterNames = () => [ownName.value, ...guestNames.values()]

   const broadcastRoster = () => {
      participants.value = rosterNames()
      broadcast({ kind: 'roster', names: participants.value })
   }

   const pushSystemMessage = (text: string, { broadcast: relay = false } = {}) => {
      const message: ChatMessage = {
         id: crypto.randomUUID(),
         author: '',
         text,
         time: Date.now(),
         system: true,
      }
      chatMessages.value = [...chatMessages.value, message]
      if (relay) {
         broadcast({ kind: 'chat', message })
      }
   }

   const sendMessage = (message: Message) => {
      videoState.value = transformMessage(message)
      broadcast({ kind: 'state', state: videoState.value })
   }

   const sendChat = (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const message: ChatMessage = {
         id: crypto.randomUUID(),
         author: ownName.value,
         text: trimmed,
         time: Date.now(),
      }
      chatMessages.value = [...chatMessages.value, { ...message, own: true }]
      broadcast({ kind: 'chat', message })
   }

   const setName = (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || trimmed === ownName.value) return
      const previous = ownName.value
      ownName.value = trimmed

      if (connectionStatus.value !== 'connected') return

      if (isHost.value) {
         pushSystemMessage(`${previous} is now ${trimmed}`, { broadcast: true })
         broadcastRoster()
      } else {
         broadcast({ kind: 'hello', name: trimmed })
      }
   }

   const registerTimeProvider = (provider: () => number) => {
      timeProvider = provider
   }

   const transformMessage = (data: Message) => {
      videoState.value.lastCommand = data.command.type
      videoState.value.isReconnection = false

      switch (data.type) {
         case 'player': {
            switch (data.command.type) {
               case 'seek': {
                  videoState.value.currentTime = data.command.timestamp
                  break
               }
               case 'play': {
                  videoState.value.isPlaying = true
                  videoState.value.currentTime = data.command.timestamp
                  break
               }
               case 'pause': {
                  videoState.value.isPlaying = false
                  videoState.value.currentTime = data.command.timestamp
                  break
               }
               case 'rate': {
                  videoState.value.rate = data.command.rate
                  break
               }
            }
            break
         }
         case 'queue': {
            switch (data.command.type) {
               case 'add': {
                  videoState.value.queue.push(data.command.item)
                  if (videoState.value.queueIdx === -1) {
                     videoState.value.queueIdx = 0
                     videoState.value.isPlaying = true
                  }
                  break
               }
               case 'next': {
                  if (videoState.value.queueIdx >= videoState.value.queue.length - 1) {
                     videoState.value.queueIdx = 0
                  } else {
                     videoState.value.queueIdx += 1
                  }
                  resetPlayback()
                  break
               }
               case 'prev': {
                  if (videoState.value.queueIdx <= 0) {
                     videoState.value.queueIdx = videoState.value.queue.length - 1
                  } else {
                     videoState.value.queueIdx -= 1
                  }
                  resetPlayback()
                  break
               }
               case 'jump': {
                  if (
                     data.command.index >= 0 &&
                     data.command.index < videoState.value.queue.length
                  ) {
                     videoState.value.queueIdx = data.command.index
                     resetPlayback()
                  }
                  break
               }
               case 'remove': {
                  const index = data.command.index
                  if (index < 0 || index >= videoState.value.queue.length) break
                  videoState.value.queue.splice(index, 1)

                  if (videoState.value.queue.length === 0) {
                     videoState.value.queueIdx = -1
                     videoState.value.isPlaying = false
                  } else if (index < videoState.value.queueIdx) {
                     videoState.value.queueIdx -= 1
                  } else if (index === videoState.value.queueIdx) {
                     // the current video was removed: stay in place, the next one takes its slot
                     if (videoState.value.queueIdx >= videoState.value.queue.length) {
                        videoState.value.queueIdx = videoState.value.queue.length - 1
                     }
                     resetPlayback()
                  }
                  break
               }
            }
         }
      }

      return videoState.value
   }

   const resetPlayback = () => {
      videoState.value.currentTime = 0
      videoState.value.rate = 1
      videoState.value.isPlaying = true
   }

   return {
      provide: {
         peer: {
            createRoom,
            joinRoom,
            leaveRoom,
            disconnect,
            sendMessage,
            sendChat,
            setName,
            registerTimeProvider,
            data: {
               isHost,
               roomId,
               videoState,
               connectionStatus,
               participants,
               chatMessages,
               chatReadCount,
               ownName,
            },
         },
      },
   }
})
