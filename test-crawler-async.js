/**
* @author: [Santosh Gupta]
**/
'use strict';

var MediumCrawl = require('./lib/medium');
var AsyncBasedCrawler = MediumCrawl.AsyncCrawler;

var crawler = new AsyncBasedCrawler();
crawler.getAllLinks();