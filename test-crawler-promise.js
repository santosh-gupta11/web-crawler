/**
* @author: [Santosh Gupta]
**/
'use strict';

var MediumCrawl = require('./lib/medium');
var PromiseBasedCrawler = MediumCrawl.PromiseCrawler;

var crawler = new PromiseBasedCrawler();
crawler.getAllLinks();

