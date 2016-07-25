var fs = require('fs-extra');
var url = require('url');
var http = require('http');
var request = require('request');
var progress = require('request-progress');
var path = require('path');
var unzip = require('unzip');
var download = function(reqUrl, dest, model){

	var options = {
		url : reqUrl
	};

	if (fs.existsSync(dest)){
		console.log('file exist.');
		return;
	}
	model.set('action', 'downloading');
	var p = progress(request(options), {throttle: 500});
	console.log(p);
	p
	.on('progress', function(state){
		model.set('book_download_percent', state.percent);
	})
	.on('error', function(err){
		console.log(err);
	})
	.on('end', function(){
		model.set('book_download_percent', 100);
	})
	.pipe(fs.createWriteStream(dest))
	.on('close',function(){
		var bookId = path.basename(dest, path.extname(dest));
		var unzipFile = unzip.Extract({path: window.App.pathBook+bookId})
		var readStream = fs.createReadStream(dest).pipe(unzipFile);
		unzipFile.on('close', function(){
			console.log(bookId + ' unziped.');
			model.set('action', 'open');
		});
	});

};

module.exports = download;

