const express = require('express');
const ClientController = require('../controllers/clientController');
const router = express.Router();

router.post('/', ClientController.createClient);
router.get('/:clientId', ClientController.getClient);
router.get('/', ClientController.getAllClients);
router.put('/:clientId', ClientController.updateClient);
router.delete('/:clientId', ClientController.deleteClient);

module.exports = router;

