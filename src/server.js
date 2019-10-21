const app = require('express')();
const bodyParser = require('body-parser');
const httpServer = require('http').Server(app);
const axios = require('axios');
const io = require('socket.io')(httpServer);
const client = require('socket.io-client');

const BlockChain = require('./models/chain');
const SocketActions = require('./constants');
const Ops = require('./routes/appOperations.js');

const socketListeners = require('./socketListeners');

const { PORT } = process.env;

const blockChain = new BlockChain(null, io);

var clients = []

app.use(bodyParser.json());

app.use('/ops', Ops);

app.post('/nodes', (req, res) => {
	const { host, port } = req.body;
	const { callback } = req.query;
	const node = `http://${host}:${port}`;
	const socketNode = socketListeners(client(node), blockChain);
	blockChain.addNode(socketNode, blockChain);
	if (callback === 'true') {
		console.info(`Added node ${node} back`);
		res.json({ status: 'Added node Back' }).end();
	} else {
		axios.post(`${node}/nodes?callback=true`, {
			host: req.hostname,
			port: PORT || 3000,
		});
		console.info(`Added node ${node}`);
		res.json({ status: 'Added node' }).end();
	}
});

app.post('/transaction', (req, res) => {
	const { sender, receiver, tokens } = req.body;
	io.emit(SocketActions.ADD_TRANSACTION, sender, receiver, amount);
	res.json({ message: 'transaction success' }).end();
});

app.post('/executeTask/:appId', (req, res, next) => {
	const { userId, script, amount } = req.body;
	if (req.params['appId'] === 'ffmpeg') {
		let intervals = script.duration;
		let startPoint = script.startPoint;
		/**
		 * Testing only! Replace with Promise.all!
		 */
		for (var i = 0; i < clients.length; i++) {
			clients[i].obj.emit(SocketActions.CHANGE_FORMAT, startPoint, intervals, 'static/sample.mp4', 'static/part' + i.toString() + '.mp4');
			newSec = Number(startPoint.split(':')[2]) + intervals;
			startPoint = startPoint.split(':')[0] + ":" + startPoint.split(':')[1] + ":" + newSec.toString();
			io.emit(SocketActions.ADD_TRANSACTION, userId, clients[i].id, amount);
			console.log('Transaction success');
			//Yep, not taking care of edge cases XD
		}
		res.json({ message: 'transaction success' }).end()
	}
});

app.get('/chain', (req, res) => {
	res.json(blockChain.toArray()).end();
});

io.on('connection', (socket) => {
	clients.push({ id: socket.id, obj: socket });
	console.info(`Socket connected, ID: ${socket.id}`);
	socket.on('disconnect', () => {
		clients.splice(clients.indexOf(client), 1);
		console.log(`Socket disconnected, ID: ${socket.id}`);
	});
});

blockChain.addNode(socketListeners(client(`http://localhost:${PORT}`), blockChain));

httpServer.listen(PORT, () => console.info(`Express server is now running on ${PORT}...`));
