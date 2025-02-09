import { removeMarker } from './map.js';
import { startCall } from './webrtc.js';
import { handleWebRTCOffer, handleWebRTCAnswer, handleIceCandidate } from './webrtc.js';

let ws;

/**
 * Initialise la connexion WebSocket et gère les événements reçus.
 * 
 * @param {Function} setUserId - Fonction pour définir l'ID de l'utilisateur.
 * @param {Function} updateMarkers - Fonction pour mettre à jour les marqueurs sur la carte.
 * @returns {WebSocket} L'instance WebSocket créée.
 */
export function initWebSocket(setUserId, updateMarkers) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${protocol}://${window.location.host}`);

    ws.onopen = () => console.log('WebSocket connecté.');

    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'clientId':
                // Associe l'ID reçu à l'utilisateur
                setUserId(data.payload);
                break;
            case 'positions':
                // Met à jour la carte avec les nouvelles positions des utilisateurs
                updateMarkers(data.payload);
                break;
            case 'remove-marker':
                // Supprime un marqueur spécifique de la carte
                removeMarker(data.userId);
                break;
            case 'request-offer':
                // Reçoit une demande d'offre WebRTC et démarre un appel
                console.log(`📡 Demande d'offre reçue pour ${data.targetId}`);
                startCall(ws, data.targetId);
                break;
            case 'offer':
                // Gère une offre WebRTC reçue
                handleWebRTCOffer(data.offer, data.senderId, ws);
                break;
            case 'answer':
                // Gère une réponse WebRTC reçue
                handleWebRTCAnswer(data.answer, data.senderId);
                break;
            case 'ice-candidate':
                // Gère un candidat ICE reçu pour la connexion WebRTC
                handleIceCandidate(data.candidate, data.senderId);
                break;
            default:
                console.log('Type de données inconnu :', data);
        }
    };
    
    ws.onerror = error => console.error('Erreur WebSocket :', error);
    
    ws.onclose = () => {
        console.log('Connexion WebSocket fermée.');
        // Tentative de reconnexion après 5 secondes
        setTimeout(() => initWebSocket(setUserId, updateMarkers), 5000);
    };

    return ws;
}

/**
 * Envoie la position actuelle de l'utilisateur via WebSocket.
 * 
 * @param {WebSocket} ws - Instance de la connexion WebSocket.
 * @param {string} userId - ID unique de l'utilisateur.
 * @param {string} userName - Nom de l'utilisateur.
 * @param {number} lat - Latitude de la position actuelle.
 * @param {number} lng - Longitude de la position actuelle.
 */
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
