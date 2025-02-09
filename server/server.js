const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const clientRoutes = require('./src/routes/clientRoutes');


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('../client/src'));
app.use(bodyParser.json());
app.use('/clients', clientRoutes);

// Démarrer le serveur HTTP
const server = app.listen(PORT, () => {
    console.log(`Serveur HTTP démarré sur http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});
// Initialiser le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Stocker les données des utilisateurs
const clients = new Map();

wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(clientId, { ws, position: null, userName: null });

    // Envoyer l'identifiant unique au client
    ws.send(JSON.stringify({ type: 'clientId', payload: clientId }));
    console.log(`Client ${clientId} connecté.`);
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'position':
                if (data.lat !== undefined && data.lng !== undefined && data.userName) {
                    clients.get(clientId).position = { lat: data.lat, lng: data.lng };
                    clients.get(clientId).userName = data.userName;
                    broadcastPositions(); // Diffuser les positions mises à jour
                } else {
                    console.warn('Données de position invalides :', data);
                }
                break;
            case 'start-call':
                // 🔹 Demande à tous les autres clients d’envoyer une offre
                clients.forEach((client, id) => {
                    if (id !== clientId && client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify({ type: 'request-offer', targetId: id }));
                    }
                });
                break;
            case 'offer': {
                if (clients.has(data.targetId)) {
                    clients.get(data.targetId).ws.send(JSON.stringify({
                        type: 'offer',
                        offer: data.offer,
                        senderId: clientId
                    }));
                }
                break;
            }
            
            case 'answer': {
                if (clients.has(data.targetId)) {
                    clients.get(data.targetId).ws.send(JSON.stringify({
                        type: 'answer',
                        answer: data.answer,
                        senderId: clientId
                    }));
                } else {
                    console.warn(`Client ${data.targetId} introuvable pour envoyer l'answer`);
                }
                break;
            }

            case 'ice-candidate': {
                if (clients.has(data.targetId)) {
                    clients.get(data.targetId).ws.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: data.candidate,
                        senderId: clientId
                    }));
                }
                break;
            }
            
            default:    
            console.error('Type de message inconnu :', data.type);
        }
    }
);

    ws.on('close', () => {
        for (const [userId, clientData] of clients.entries()) {
            if (clientData.ws === ws) {
                clients.delete(userId);
                broadcastDisconnection(userId);
                console.log(`Client ${userId} déconnecté.`);
                break;
            }
        }
    });
});

/**
 * Diffuse les positions de tous les clients connectés à tous les autres clients.
 * Seuls les clients ayant une position définie sont inclus dans la diffusion.
 */
function broadcastPositions() {
    const positions = Array.from(clients.entries()).map(([clientId, client]) => ({
        userId: clientId,
        userName: client.userName,
        lat: client.position?.lat,
        lng: client.position?.lng,
    })).filter(pos => pos.lat && pos.lng);

    clients.forEach(({ ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'positions', payload: positions }));
        }
    });
}

/**
 * Informe tous les clients connectés de la déconnexion d'un utilisateur
 * en leur envoyant un message pour supprimer son marqueur sur la carte.
 *
 * @param {string} userId - Identifiant de l'utilisateur qui s'est déconnecté.
 */
function broadcastDisconnection(userId) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'remove-marker', userId }));
        }
    });
}
