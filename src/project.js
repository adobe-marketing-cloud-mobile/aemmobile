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

 /**
 * Module dependencies.
 */
var FS = require('q-io/fs');
var fs = require('fs');
var Q = require('q');
var path = require('path');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var cordova = cordova_lib.cordova;
var article = require('./article');


module.exports.create = create;
function create(options, projectPath) 
{	
	var fullProjectPath = null;
	return Q.fcall( () => 
	{
		if (!projectPath)
		{
			throw Error(`At least the dir must be provided to create new project. See 'aemm help'.`)
		}
		
		fullProjectPath = path.resolve(projectPath);
		events.emit("log", `Creating project ${path.basename(fullProjectPath)}`);
	})
	.then( () => createCordovaApp(projectPath) )
	.then( () => removeUnwantedCordovaArtifacts(fullProjectPath) )
	.then( () => createAEMMScaffolding(fullProjectPath) );
}

module.exports.projectRootPath = projectRootPath;
function projectRootPath()
{
	let projectRoot = cordova.findProjectRoot(process.cwd());
	if (!projectRoot)
	{
		let cmdLineToolInfo = require('../package.json');
		throw Error(`Current working directory is not a ${cmdLineToolInfo.name} based project.`);
	}
	return projectRoot;
}

module.exports.articleList = articleList;
function articleList() 
{
	// Get list of articles to serve
	var wwwFolder = path.join(projectRootPath(), "/www");
	return FS.list(wwwFolder)
	.then( function (fileArray) 
	{
		let sortedFileArray = fileArray.sort((a,b) => a.localeCompare(b));
		let articleNameList = sortedFileArray.filter( (fileName) => !fileName.startsWith(".") && fs.lstatSync(path.join(wwwFolder, fileName)).isDirectory());		
		// Get metadata from article if it has any
		let articleInfoPromiseList = articleNameList.map( (articleName) => metadataForArticle(path.join(wwwFolder, articleName)))
		return Q.all(articleInfoPromiseList)
	});
}

function metadataForArticle(articlePath)
{
	let metadataPath = path.join(articlePath, "metadata.json");
	return FS.exists(metadataPath)
	.then( (exists)=> {
		if (!exists)
		{
			return updateMetadata({}, articlePath);
		}
			
		return FS.read(metadataPath)
		.then( (fileContents) => {
			let json = JSON.parse(fileContents);
			return updateMetadata(json, articlePath);
		})
		.catch( (err) => {
			events.emit("log", `Could not get metadata from ${articlePath}/metadata.json file: ${err}`);
		})
	})
	.catch( () =>  updateMetadata({}, articlePath) );	// Don't fail over this, just don't use metadata		
}

function updateMetadata(json, articlePath)
{
	let articleName = path.basename(articlePath);
	json.id = `urn:xx-xx:article:${articleName}`;
	json.type = "article";
	json.metadata = json.metadata || {};
	json.metadata.entityName = articleName;
	if (!json.metadata.title)
	{
		json.metadata.title = articleName;
	}
	return json;
}

function removeUnwantedCordovaArtifacts(appPath)
{
	return Q.all([
		FS.removeTree(path.join( appPath, "hooks")),
		FS.removeTree(path.join( appPath, "platforms")),
		FS.removeTree(path.join( appPath, "plugins")),
		FS.remove(path.join( appPath, "www", "index.html")),
		FS.removeTree(path.join( appPath, "www", "css")),
		FS.removeTree(path.join( appPath, "www", "img")),
		FS.removeTree(path.join( appPath, "www", "js"))
	]); 
}

function createAEMMScaffolding(fullProjectPath)
{
	let currentDir = process.cwd();
	process.chdir(fullProjectPath);
	return article.create({}, "SampleArticle")
	.finally( () => {
		process.chdir(currentDir);
	});
}

function createCordovaApp(projectName) 
{
	return cordova.raw.create( projectName, "com.adobe.dps.CordovaPlugins", "CordovaPlugins", {});
}


