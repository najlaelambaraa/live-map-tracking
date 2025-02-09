import { initMap, updateMarkers } from './map.js';
import { initWebSocket, sendPosition } from './websocket.js';
import { startVideoConference } from './webrtc.js';

let userId = '';
let ws;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startTracking').addEventListener('click', () => {
        const inputName = document.getElementById('userName').value.trim();
        if (inputName) {
            const userName = inputName;
            document.getElementById('nameInputContainer').style.display = 'none';
            document.getElementById('map').style.display = 'block';
            document.getElementById('startVideoConferenceButton').style.display = 'block';

            ws = initWebSocket(userId => userId = userId, updateMarkers);
            initMap(userName, (lat, lng) => sendPosition(ws, userId, userName, lat, lng));
        } else {
            alert('Veuillez entrer un nom valide.');
        }
    });

    document.getElementById('startVideoConferenceButton').addEventListener('click', () => {
        if (ws) {
            startVideoConference(ws, userId);
        } else {
            console.error("WebSocket non initialisé");
        }
    });
});