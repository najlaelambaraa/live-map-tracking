let map;
let markers = {};

/**
 * Initialise la carte et configure la géolocalisation.
 * 
 * @param {string} userName - Nom de l'utilisateur local.
 * @param {Function} onPositionUpdate - Fonction callback appelée lors de la mise à jour de la position.
 */
export function initMap(userName, onPositionUpdate) {
    map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 15);

                if (!markers['localUser']) {
                    markers['localUser'] = L.marker([latitude, longitude])
                        .addTo(map)
                        .bindPopup(`<b>${userName}</b>`)
                        .openPopup();
                } else {
                    markers['localUser'].setLatLng([latitude, longitude]);
                }

                onPositionUpdate(latitude, longitude);
            },
            error => {
                console.error('Erreur de géolocalisation :', error);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
    } else {
        alert("La géolocalisation n'est pas prise en charge par votre navigateur.");
    }
}

/**
 * Met à jour les marqueurs des utilisateurs sur la carte.
 * 
 * @param {Array<{userId: string, userName: string, lat: number, lng: number}>} positions - Liste des positions des utilisateurs.
 */
export function updateMarkers(positions) {
    positions.forEach(({ userId, userName, lat, lng }) => {
        if (!markers[userId]) {
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${userName}</b>`);
            markers[userId] = marker;
        } else {
            markers[userId].setLatLng([lat, lng]);
        }
    });
}

/**
 * Supprime un marqueur de la carte.
 * 
 * @param {string} userId - Identifiant de l'utilisateur dont le marqueur doit être supprimé.
 */
export function removeMarker(userId) {
    if (markers[userId]) {
        map.removeLayer(markers[userId]);
        delete markers[userId];
    } else {
        console.warn(`Marqueur ${userId} introuvable.`);
    }
}
