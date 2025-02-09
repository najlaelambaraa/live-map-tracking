let localStream;
const peerConnections = {};

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

/**
 * Démarre une vidéoconférence en capturant le flux local et en l'affichant.
 * 
 * @param {WebSocket} ws - Instance WebSocket pour envoyer les messages.
 * @param {string} userId - Identifiant unique de l'utilisateur.
 */
export async function startVideoConference(ws, userId) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        document.getElementById('videoSection').style.display = 'block';

        ws.send(JSON.stringify({ type: 'start-call', userId }));
        document.getElementById('localVideo').play().catch(error => {
            console.warn("Impossible de lire la vidéo locale", error);
        });
    } catch (error) {
        console.error('Erreur de capture vidéo :', error);

        if (error.name === "NotAllowedError") {
            alert("Autorisation refusée ! Activez la caméra et le micro.");
        } else if (error.name === "NotFoundError") {
            alert("Aucun périphérique caméra/micro trouvé !");
        } else if (error.name === "NotReadableError") {
            alert("La caméra/micro est utilisée par une autre application !");
        } else {
            alert("Erreur inconnue, vérifiez la console !");
        }
    }
}

/**
 * Gère une offre WebRTC reçue et établit une connexion entre pairs.
 * 
 * @param {RTCSessionDescriptionInit} offer - Offre WebRTC reçue.
 * @param {string} senderId - Identifiant de l'expéditeur.
 * @param {WebSocket} ws - Instance WebSocket pour envoyer les réponses.
 */
export function handleWebRTCOffer(offer, senderId, ws) {

    if (peerConnections[senderId]) {
        peerConnections[senderId].close();
        delete peerConnections[senderId];
    }

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[senderId] = peerConnection;

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => console.log(`Offre WebRTC appliquée pour ${senderId}`))
        .catch(error => console.error(`Erreur setRemoteDescription (offer) :`, error));

    peerConnection.ontrack = event => {
        attachRemoteStream(event.streams[0], senderId);
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log(`🧊 Envoi ICE Candidate à ${senderId}`);
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate,
                targetId: senderId
            }));
        }
    };

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.createAnswer()
        .then(answer => {
            console.log(`📡 Réponse WebRTC envoyée à ${senderId}`);
            peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer, targetId: senderId }));
        })
        .catch(error => console.error(`Erreur lors de la création de l'answer :`, error));
}

/**
 * Gère une réponse WebRTC reçue et applique la description distante.
 * 
 * @param {RTCSessionDescriptionInit} answer - Réponse WebRTC reçue.
 * @param {string} senderId - Identifiant de l'expéditeur.
 */
export function handleWebRTCAnswer(answer, senderId) {
    if (!peerConnections[senderId]) {
        console.warn(`Impossible d'appliquer l'answer, connexion inexistante pour ${senderId}`);
        return;
    }

    if (peerConnections[senderId].signalingState === "stable") {
        console.warn(`La connexion WebRTC avec ${senderId} est déjà en état stable.`);
        return;
    }

    peerConnections[senderId].setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => console.log(`Réponse WebRTC ${senderId}`))
        .catch(error => console.error(`Erreur :`, error));
}
/**
 * Gère un candidat ICE reçu et l'ajoute à la connexion.
 * 
 * @param {RTCIceCandidateInit} candidate - Candidat ICE reçu.
 * @param {string} senderId - Identifiant de l'expéditeur.
 */
export function handleIceCandidate(candidate, senderId) {
    if (peerConnections[senderId]) {
        peerConnections[senderId].addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        console.warn(`ICE Candidate reçu pour un utilisateur: ${senderId}`);
    }
}
/**
 * Attache un flux vidéo distant à un élément vidéo dans l'interface utilisateur.
 * 
 * @param {MediaStream} stream - Flux vidéo reçu de l'utilisateur distant.
 * @param {string} senderId - Identifiant de l'expéditeur du flux.
 */
function attachRemoteStream(stream, senderId) {

    let remoteVideo = document.getElementById(`remoteVideo-${senderId}`);
    if (!remoteVideo) {
        remoteVideo = document.createElement("video");
        remoteVideo.id = `remoteVideo-${senderId}`;
        remoteVideo.classList.add("w-[150px]", "h-[150px]", "border", "border-gray-300", "rounded-lg");
        remoteVideo.autoplay = false;
        remoteVideo.srcObject = stream;
        setTimeout(() => {
            remoteVideo.play().catch(error => {
                console.warn(`Impossible de lire la vidéo pour ${senderId}`, error);
            });
        }, 1000);
        document.getElementById("videoSection").appendChild(remoteVideo);
    }

    if (stream && stream.getTracks().length > 0) {

        remoteVideo.srcObject = stream;
        setTimeout(() => {
            remoteVideo.play().catch(error => {
                console.warn(`Impossible de lire la vidéo pour ${senderId}`, error);
            });
        }, 500);
    } else {
        console.warn(`Aucun flux vidéo reçu pour ${senderId}`);
    }
}

/**
 * Démarre un appel WebRTC en créant une connexion entre pairs et en envoyant une offre.
 * 
 * @param {WebSocket} ws - Instance WebSocket pour communiquer avec l'autre pair.
 * @param {string} targetId - Identifiant de l'utilisateur cible pour l'appel.
 */
export async function startCall(ws, targetId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket non initialisé !");
        return;
    }

    try {
        const peerConnection = new RTCPeerConnection(config);
        peerConnections[targetId] = peerConnection;

        // Ajouter le flux local
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // Gérer la réception des flux vidéo distants
        peerConnection.ontrack = event => {
            console.log(`📡 Flux distant reçu de ${senderId}`);
            attachRemoteStream(event.streams[0], targetId);
        };

        // Gestion des candidats ICE
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                ws.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetId: targetId
                }));
            }
        };

        // Création et envoi de l'offre
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'offer', offer, targetId }));

    } catch (error) {
        console.error('Erreur lors de la création de l’appel :', error);
    }
}
