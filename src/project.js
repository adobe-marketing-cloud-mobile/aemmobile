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

 /**
 * Module dependencies.
 */
var FS = require('q-io/fs');
var fs = require('fs');
var Q = require('q');
var path = require('path');
var cordova_lib = require('../lib/cordova').lib;
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
			throw Error(`At least the dir must be provided to create new project. See 'aemm help project'.`);
		}
		
		fullProjectPath = path.resolve(projectPath);
		events.emit("log", `Creating project ${path.basename(fullProjectPath)}`);
	})
	.then( () => createCordovaApp(fullProjectPath) )
	.then( () => removeUnwantedCordovaArtifacts(fullProjectPath) )
	.then( () => populateProjectMetadata(fullProjectPath) )
	.then( () => {
		// Only skip the samples if we are explicitly asked to skip them. (null is assumed to mean true)
		return (options.samples !== false) ? createAEMMScaffolding(fullProjectPath) : preserveWwwDir(fullProjectPath); 
	});
}

module.exports.projectRootPath = projectRootPath;
function projectRootPath()
{
	var projectRoot = cordova.findProjectRoot(process.cwd());
	return isAEMMProject(projectRoot)
	.then( (isAEMM) => {
		if (!projectRoot || !isAEMM)
		{
			var cmdLineToolInfo = require('../package.json');
			throw Error("Current working directory is not an `aemm` based project. If you believe you are in the appropriate project directory, you may need to re-create the project using `aemm project create`.");
		}
		return Q(projectRoot);
	});	
}

module.exports.articleList = articleList;
function articleList() 
{
	var wwwFolder = null;
	return projectRootPath()
	.then( (projectRootPath) => {
		// Get list of articles to serve
		wwwFolder = path.join(projectRootPath, "www");
		return FS.list(wwwFolder);
	})
	.then( function (fileArray) 
	{
		var sortedFileArray = fileArray.sort((a,b) => a.localeCompare(b));
		var articleNameList = sortedFileArray.filter( (fileName) => !fileName.startsWith(".") && fs.lstatSync(path.join(wwwFolder, fileName)).isDirectory());		
		// Get metadata from article if it has any
		var articleInfoPromiseList = articleNameList.map( (articleName) => metadataForArticle(path.join(wwwFolder, articleName)));
		return Q.all(articleInfoPromiseList);
	});
}

function metadataForArticle(articlePath)
{
	var metadataPath = path.join(articlePath, "metadata.json");
	return FS.exists(metadataPath)
	.then( (exists)=> {
		if (!exists)
		{
			return updateMetadata({}, articlePath);
		}
			
		return FS.read(metadataPath)
		.then( (fileContents) => {
			var json = JSON.parse(fileContents);
			return updateMetadata(json, articlePath);
		})
		.catch( (err) => {
			events.emit("log", `Could not get metadata from ${articlePath}/metadata.json file: ${err}`);
		});
	})
	.catch( () =>  updateMetadata({}, articlePath) );	// Don't fail over this, just don't use metadata		
}

function updateMetadata(json, articlePath)
{
	var articleName = path.basename(articlePath);
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

function preserveWwwDir(fullProjectPath)
{
	var placeholderPath = path.join(fullProjectPath, 'www', '.placeholder');
	return FS.write(placeholderPath, '# This file guarantees that the www directory will remain.');
}

function createAEMMScaffolding(fullProjectPath)
{
	var currentDir = process.cwd();
	process.chdir(fullProjectPath);
	return article.create({}, "SampleArticle")
	.finally( () => {
		process.chdir(currentDir);
	});
}

function populateProjectMetadata(fullProjectPath) {
	var metadataJson = {};
	metadataJson.createdByAemmVersion = require('../package.json').version;
	return FS.write(path.join(fullProjectPath, '.aemm'), JSON.stringify(metadataJson, null , 2));
}

function createCordovaApp(projectName) 
{
	return cordova.raw.create( projectName, "com.adobe.aemmobile.CordovaPlugins", "CordovaPlugins", {});
}

function isAEMMProject(projectRoot) {
	if (!projectRoot) {
		return Q(false);
	}
	return FS.exists(path.join(projectRoot, ".aemm"), "r");
}