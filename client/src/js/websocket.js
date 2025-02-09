import { removeMarker } from './map.js';
import { startCall } from './webrtc.js';
import { handleWebRTCOffer, handleWebRTCAnswer, handleIceCandidate } from './webrtc.js';
let ws;

export function initWebSocket(setUserId, updateMarkers) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${protocol}://${window.location.host}`);

    ws.onopen = () => console.log('WebSocket connecté.');
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'clientId':
                setUserId(data.payload);
                break;
            case 'positions':
                updateMarkers(data.payload);
                break;
            case 'remove-marker':
                removeMarker(data.userId);
                break;
            case 'request-offer':
                console.log(`📡 Demande d'offre reçue pour ${data.targetId}`);
                startCall(ws, data.targetId);
                break;
            case 'offer':
                handleWebRTCOffer(data.offer, data.senderId, ws);
                break;
            case 'answer':
                handleWebRTCAnswer(data.answer, data.senderId);
                break;
            case 'ice-candidate':
                handleIceCandidate(data.candidate, data.senderId);
                break;
            default:
                console.log('data type', data);
        }
    };
    ws.onerror = error => console.error('Erreur WebSocket :', error);
    ws.onclose = () => {
        console.log('Connexion WebSocket fermée.');
        setTimeout(() => initWebSocket(setUserId, updateMarkers), 5000);
    };

    return ws;
}

export function sendPosition(ws, userId, userName, lat, lng) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'position',
            userId,
            userName,
            lat,
            lng,
        }));
    }
}
