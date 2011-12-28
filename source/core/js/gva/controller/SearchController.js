/*
Copyright 2011 Google

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
 * Provide a namespace for this class
 */
goog.provide('gva.controller.SearchController');

/**
 * Import dependencies
 */
goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('gva.controller.AbstractController');
goog.require('gva.model.DataModel');


/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.SearchController = function() {

    this._searchGrid = null;
    this._$searchTitle = null;

    // Call super constructor
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController.
 */
goog.inherits(gva.controller.SearchController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.SearchController.prototype.initialize = function($context) {

    // Call super initialize method
    this.constructor.superClass_.initialize.call(this, $context);

    // Get the show and episode grid component instances.
    this._searchGrid = gva.component.ComponentInitializer.getComponentByQuery('.search-grid');

    // Find the heading which we'll populate when showing search results
    this._$searchTitle = goog.dom.query('header h2', this.$context)[0];
};

/**
 * @inheritDoc
 */
gva.controller.SearchController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.SearchController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
};

/**
 * Tells the controller to handle deep linking beyond the top level section depth.
 * @param {Array.<string>} segments A list of URL fragments beyond the root level.
 * @param {boolean=} instant If true, no transition will be applied.
 */
gva.controller.SearchController.prototype.navigate = function(segments, instant) {


    // Normal text search.
    if (segments.length == 1) {

        var searchTerm = segments.join(' ');

        // Update the section title
        goog.dom.setTextContent(this._$searchTitle, 'Search Results for "' + searchTerm + '"');

        // Search the model for matching episodes
        var model = gva.model.DataModel.getInstance();
        var results = model.searchEpisodes(searchTerm);

        // Push the results to the grid
        this._searchGrid.setResults(results);

    }

    // New episode search.
    else if (segments.length > 1) {

        var startTime = parseInt(segments[1], 10);

        var model = gva.model.DataModel.getInstance();
        var results = model.searchEpisodesByTimestamp(startTime);

        // Update the section title
        goog.dom.setTextContent(this._$searchTitle, 'New Episodes');

        this._searchGrid.setResults(results);

    }

    // Default no results.
    else {
        // Update the section title
        goog.dom.setTextContent(this._$searchTitle, 'No Results');
    }
};

/**
 * Export the fully qualified class name of this controller for dependency
 * injection
 */
goog.exportSymbol('gva.controller.SearchController', gva.controller.SearchController);
