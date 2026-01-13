import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

export class MeshNetwork {
    constructor(onData, onPeerConnect, onPeerDisconnect) {
        this.id = uuidv4().substring(0, 8).toUpperCase();
        this.peer = null;
        this.connections = new Map(); // peerId -> connection
        this.onData = onData;
        this.onPeerConnect = onPeerConnect;
        this.onPeerDisconnect = onPeerDisconnect;
        this.isReady = false;
    }

    initialize() {
        this.connectToPeerServer();
    }

    connectToPeerServer() {
        try {
            console.log('Initializing PeerJS connection...');
            // Connect to PeerJS cloud server
            this.peer = new Peer(this.id, {
                debug: 1, // Reduced debug level to avoid noise
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            this.peer.on('open', (id) => {
                console.log('✅ Connected to P2P Server. Peer ID:', id);
                this.isReady = true;
                if (this.onPeerConnect) this.onPeerConnect('SERVER_CONNECTED'); // internal signal
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('disconnected', () => {
                console.log('⚠️ Disconnected from PeerServer. Attempting reconnect...');
                this.isReady = false;
                // Attempt reconnect
                setTimeout(() => {
                    if (this.peer && !this.peer.destroyed) {
                        this.peer.reconnect();
                    }
                }, 5000);
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS Error (handled):', err.type); // Log as warning, not error
                if (err.type === 'peer-unavailable') {
                    // Peer not found
                } else if (err.type === 'network' || err.type === 'server-error') {
                    console.log('Network/Server error. Switching to Offline Mode temporarily.');
                }
            });

        } catch (err) {
            console.error('Initialization failed:', err);
        }
    }

    connectTo(peerId) {
        if (!this.peer || this.connections.has(peerId)) return;

        console.log(`Connecting to ${peerId}...`);
        const conn = this.peer.connect(peerId);
        this.handleConnection(conn);
    }

    handleConnection(conn) {
        conn.on('open', () => {
            console.log(`Connected to: ${conn.peer}`);
            this.connections.set(conn.peer, conn);
            if (this.onPeerConnect) this.onPeerConnect(conn.peer);
        });

        conn.on('data', (data) => {
            console.log('Received data:', data);
            if (this.onData) this.onData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log(`Connection closed: ${conn.peer}`);
            this.connections.delete(conn.peer);
            if (this.onPeerDisconnect) this.onPeerDisconnect(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }

    broadcast(message) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    disconnect() {
        if (this.peer) {
            this.peer.destroy();
        }
        this.connections.clear();
    }
}
