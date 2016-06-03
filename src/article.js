/**
	Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */
"use strict";

var FS = require('q-io/fs');
var fs = require('fs');
var Q = require('q');
var path = require("path");
var project = require('./project');
var pathToNewArticleTemplate = path.join(__dirname, '..', 'templates', 'new_article');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

module.exports.testing = {};

module.exports.create = create;
function create(options /*, list of article names  */ )
{
	return Q.fcall( () => 
	{
		let articleNamesList = Array.prototype.slice.call(arguments, 1).filter( (item) => item && item.length > 0) ;
		if (articleNamesList.length <= 0)
		{
			throw Error( `You must specify an article name with the 'article create' command.`);
		}
		let projectPath = project.projectRootPath();
		let articlePromises = articleNamesList.map( (articleName) => createSingleArticle(projectPath, articleName) );
		return Q.allSettled(articlePromises);		
	});
}

function createSingleArticle(projectPath, articleName)
{
	var articleFolder = null;
	return Q.fcall( () => 
	{
		if (!isArticleNameValid(articleName))
		{
			throw new Error("Article name has a limit of 64 alphanumeric characters. The value must start and end with a letter or number and can also contain dots, dashes and underscores.");
		}
		
		articleFolder = path.join(projectPath, "/www", articleName);
		return articleFolder;
	})
	.then( () => FS.exists(articleFolder) )
	.then(function(exists) {
		if (exists)
		{
			throw Error(`Cannot create article ${articleName}.  An article with that name already exists at ${articleFolder}.`);
		}
		return articleFolder;
	})
	.then(function (articleFolder) {
		return FS.makeTree(articleFolder);
	})
	.then( function() {
		return FS.copyTree(pathToNewArticleTemplate, articleFolder); 
	})
	.then( () => events.emit("log", "Created Article: " + articleName));
}


module.exports.testing.isArticleNameValid = isArticleNameValid;
function isArticleNameValid(articleName)
{
	if (articleName.length > 64 || !articleName.match(/^[a-zA-Z0-9][a-zA-Z0-9\._-]*$/))
	{
		return false;
	} 
	
	return true;	
}
