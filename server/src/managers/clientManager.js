const clients = new Map();
const Client = require('../models/client');

class ClientManager {
    static createClient(clientId, position, name) {
        const client = new Client(clientId, position, name);
        clients.set(clientId, client);
        return client;
    }

    static getClient(clientId) {
        return clients.get(clientId) || null;
    }

    static getAllClients() {
        return Array.from(clients.values());
    }

    static updateClient(clientId, position, name) {
        if (!clients.has(clientId)) return null;
        const updatedClient = new Client(clientId, position, name);
        clients.set(clientId, updatedClient);
        return updatedClient;
    }

    static deleteClient(clientId) {
        return clients.delete(clientId);
    }
}

module.exports = ClientManager;