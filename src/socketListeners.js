const SocketActions = require('./constants');
const request = require('request');
const Transaction = require('./models/transaction');
const Blockchain = require('./models/chain');

const socketListeners = (socket, chain) => {
	socket.on(SocketActions.ADD_TRANSACTION, (sender, receiver, amount) => {
		const transaction = new Transaction(sender, receiver, amount);
		chain.newTransaction(transaction);
		console.info(`Added transaction: ${JSON.stringify(transaction.getDetails(), null, '\t')}`);
	});

	socket.on(SocketActions.END_MINING, (newChain) => {
		console.log('End Mining encountered');
		process.env.BREAK = true;
		const blockChain = new Blockchain();
		blockChain.parseChain(newChain);
		if (blockChain.checkValidity() && blockChain.getLength() >= chain.getLength()) {
			chain.blocks = blockChain.blocks;
		}
	});

	socket.on(SocketActions.CHANGE_FORMAT, (startPoint, duration, url, saveUrl) => {
		request.post('http://localhost:3000/ops/sliceVideo', {
			json: {
				startPoint, duration, url, saveUrl
			}
		}, (error, res, body) => {
			if (error) {
				console.error(error)
				return
			}
			console.log(`statusCode: ${res.statusCode}`)
			console.log(body);

			request.post('http://localhost:3000/ops/changeFormat', {
				json: {
					url: saveUrl, saveUrl: saveUrl.split('.')[0] + '.m4v'
				}
			}, (err, resInner, bodyInner) => {
				console.log(`statusCode: ${resInner.statusCode}`)
				console.log(bodyInner);
			});
		})
	});

	return socket;
};

module.exports = socketListeners;
