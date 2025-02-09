const ClientManager = require('../managers/clientManager');

class ClientController {
    static createClient(req, res) {
        const { clientId, position, name } = req.body;
        const client = ClientManager.createClient(clientId, position, name);
        res.status(201).json(client);
    }

    static getClient(req, res) {
        const { clientId } = req.params;
        const client = ClientManager.getClient(clientId);
        if (client) {
            res.status(200).json(client);
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    }

    static getAllClients(req, res) {
        const clients = ClientManager.getAllClients();
        res.status(200).json(clients);
    }

    static updateClient(req, res) {
        const { clientId } = req.params;
        const { position, name } = req.body;
        const updatedClient = ClientManager.updateClient(clientId, position, name);
        if (updatedClient) {
            res.status(200).json(updatedClient);
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    }

    static deleteClient(req, res) {
        const { clientId } = req.params;
        const isDeleted = ClientManager.deleteClient(clientId);
        if (isDeleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    }
}

module.exports = ClientController;