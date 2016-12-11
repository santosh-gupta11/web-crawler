/**
* @author: [Santosh Gupta]
**/
'use strict';

var request = require('request');
var Q = require('q');
var cheerio = require('cheerio');
var fs = require('fs');

var Crawler = module.exports = function () {
	var self= this
	self.url = 'https://medium.com/';
	self.processedUrls = [];
	self.inProcessUrls = [];
	self.waitingUrls = [];
}

Crawler.prototype.getAllLinks = function(){
	var self = this;
	var deferred = Q.defer();
	self.inProcessUrls.push(self.url)

	self.getPageLinks(self.url)
	.then(function(result){
		var data = self.processedUrls.join(', ')
		return writeToFile(__dirname + '/result/output_promise.csv', data)
	})
	.fail(function(error){
		deferred.reject(error);
	})
	return deferred.promise;
}

Crawler.prototype.getPageLinks = function(url) {
	var self =this;
	var deferred = Q.defer();

	self.requestPageData(url)
	.then(function(result){
		self.processedUrls.push(url)
		self.inProcessUrls.splice(self.inProcessUrls.indexOf(url), 1);

		var newUrls = self.parseHtmlForNewLinks(result)
		self.waitingUrls.push.apply(self.waitingUrls, newUrls);
		var promises = [];

		while(self.inProcessUrls.length < 5 && self.waitingUrls.length > 0){
			self.inProcessUrls.push(self.waitingUrls.pop())
			promises.push(self.getPageLinks(self.inProcessUrls[self.inProcessUrls.length -1]))
		}
		return Q.all(promises)
	})
	.then(function(){
		deferred.resolve();
	})
	.fail(function(error){
		deferred.reject(error)
	})
	return deferred.promise;
}

Crawler.prototype.parseHtmlForNewLinks = function(html) {
	var self =this;
	var curLinks = []
	var $ = cheerio.load(html);
	$('a').each(function(index, elem){
		if(this.attribs.href){
			var link = this.attribs.href.split('//')[1];
			link = 'https://'+link

			if(link.indexOf('medium.com') !== -1 && 
			curLinks.indexOf(link) == -1 && 
			self.processedUrls.indexOf(link) == -1 && 
			self.inProcessUrls.indexOf(link) == -1 && 
			self.waitingUrls.indexOf(link) == -1){
				curLinks.push(link)
			}
		}
	})
	return curLinks;
}

Crawler.prototype.requestPageData = function(url) {
	var deferred = Q.defer();
	var retries = 0;
	var maxRetrycount = 3;

	var onResponse = function (error, response, body) {
		if (error || !body || response.statusCode !== 200) {
			if(retries < maxRetrycount){
				console.log("Retrying :"+url);
				attemptRequest();
			}
			else{
				deferred.reject(error)
			}
		} else {
			deferred.resolve(body)
		}
	}

	function attemptRequest(){
		request.get({
			url: url,
			method: 'GET'
		},onResponse)
	}
	attemptRequest()

	return deferred.promise;
}

function writeToFile(fileName, data){
	var deferred = Q.defer();
	fs.writeFile(fileName, data, function(error){
		if(error){
			console.log("Error in writing file contents :"+error);
			deferred.reject(error)
		}
		else{
			deferred.resolve();
		}
	})
	return deferred.promise;
}