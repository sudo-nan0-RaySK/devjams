const express = require('express');
const router = express.Router();
const ffmpeg = require('fluent-ffmpeg');
const hbjs = require('handbrake-js');

//ffmpeg operations
function sliceVideo(req, res, next) {
	let { startPoint, duration, url, saveUrl } = req.body;
	console.log('In sliceVideo', req.body);
	ffmpeg(url)
		.setStartTime(startPoint)
		.setDuration(duration)
		.output(saveUrl)

		.on('end', function (err) {
			if (!err) {
				console.log('conversion Done')
				res.json({ success: true });
			}
		})
		.on('error', function (err) {
			console.log('error: ', +err);
			res.json({ success: false, msg: err.message });

		}).run();
}

//change format
function changeFormat(req, res, next) {
	hbjs.spawn({ input: req.body.url, output: req.body.saveUrl })
		.on('error', err => {
			console.log('error occured', err);
		})
		.on('progress', progress => {
			console.log(
				'Percent complete: %s, ETA: %s',
				progress.percentComplete,
				progress.eta
			);
		})
		.on('complete', cc => {
			res.json({ success: true });
		})
}

router.post('/sliceVideo', sliceVideo);
router.post('/changeFormat', changeFormat);

module.exports = router;