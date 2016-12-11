/**
* @author: [Santosh Gupta]
**/
'use strict';

var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');

var Crawler = module.exports = function () {
	var self= this
	self.urls = ['https://medium.com/'];
	self.processedUrls = [];
	self.markedUrls = [];
	self.queue = async.queue(self.requestPageData, 5);
	self.queue.drain = function() {
		var data = self.processedUrls.join(', ')
		fs.writeFile(__dirname + '/result/output_async.csv', data, function(error){
			if(error){
				console.log("Error in writing file contents :"+error);
			}
		})
	};
}

Crawler.prototype.getAllLinks = function(){
	var self = this;
	self.getPageLinks(self.urls)
}

Crawler.prototype.getPageLinks = function(urls) {
	var self = this;
	self.markedUrls.push.apply(self.markedUrls, urls)
	self.queue.push(urls, function(error, result, processedUrl){
		if(!error){
			self.processedUrls.push(processedUrl)
			var links = self.parseHtmlForNewLinks(result)
			self.getPageLinks(links)
		}
		else{
			console.log(error)
			self.getPageLinks(urls)
		}
	})
}

Crawler.prototype.parseHtmlForNewLinks = function(html) {
	var self =this;
	var curLinks = []
	var $ = cheerio.load(html);
	$('a').each(function(index, elem){
		if(this.attribs.href){
			var link = this.attribs.href.split('//')[1];
			link = 'https://'+link;

			if(link.indexOf('medium.com') !== -1 && 
			curLinks.indexOf(link) == -1 && 
			self.markedUrls.indexOf(link) == -1){
				curLinks.push(link)
			}
		}
	})
	return curLinks;
}

Crawler.prototype.requestPageData = function(url, callback) {
	var retries = 0;
	var maxRetrycount = 3;

	var onResponse = function (error, response, body) {
		if (error || !body || response.statusCode !== 200) {
			if(retries < maxRetrycount){
				console.log("Retrying :"+url);
				attemptRequest();
			}
			else{
				callback(error)
			}
		} else {
			callback(null, body, url)
		}
	}

	function attemptRequest(){
		request.get({
			url: url,
			method: 'GET'
		},onResponse)
	}
	attemptRequest()
}