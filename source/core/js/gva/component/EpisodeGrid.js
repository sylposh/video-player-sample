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
goog.provide('gva.component.EpisodeGrid');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.dataset');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.math.Rect');
goog.require('goog.style');

goog.require('gva.component.BaseComponent');
goog.require('gva.component.FlexibleGrid');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.EpisodeGrid = function() {

    /**
     * The flexible grid for arranging items.
     * @type {gva.component.FlexibleGrid}
     */
    this._grid = new gva.component.FlexibleGrid();


    this._dataModel = null;

    // Call super constructor
    gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.EpisodeGrid, gva.component.BaseComponent);


/**
 * @inheritDoc
 */
gva.component.EpisodeGrid.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    // Set up the fixed grid cell size.
    this._grid.initialize($context, 210, 180, 12, 55);

    // Get data model instance.
    this._dataModel = gva.model.DataModel.getInstance();
};

/**
 * Refreshes the episode grid when episode data has changed
 * @param {Array.<Object>} episodeData The updated episode data.
 */
gva.component.EpisodeGrid.prototype.refresh = function(episodeData) {

    var $gridItems = this._grid.getItems();
    var $gridItem;
    var episodeObj;
    var episodeID;

    for (var i = 0, n = $gridItems.length; i < n; i++) {

        $gridItem = $gridItems[i];

        // Get the episode ID from the elements data attribute
        episodeID = goog.dom.dataset.get($gridItem, 'episodeid');

        // Find the corresponding episode data object
        episodeObj = goog.array.find(episodeData, function(episode) {
            return episode.id === episodeID;
        });

        // If the episode has been watched, tag it as such
        if (episodeObj && episodeObj.watched) {
            goog.dom.classes.add($gridItem, 'watched');
        }
    }
};

/**
 * Creates a DOM element for an item and appends it to the grid
 * @param {Object} item The data for the item to add.
 */
gva.component.EpisodeGrid.prototype.addItem = function(item) {

    // Format the date
    var date = new Date(item.airdate);
    var dateStr = gva.util.DateUtil.formatDate(date, 'M j, Y');

    // Create markup for the grid item
    var itemMarkup = '' +
    '<article class="episode" data-episodeid="' + item.id + '">' +
        '<figure>' +
            '<a href="/home/' + item.slug + '/" data-episodeid="' + item.id + '">' +
                '<img src="' + item.image_url + '"/>' +
                '<span>Play</span>' +
            '</a>' +
        '</figure>' +
        '<header>' +
            '<h3>' + item.title + '</h3>' +
        '</header>' +
        '<footer>' +
            '<p>Date: ' + dateStr + '</p>' +
        '</footer>' +
    '</article>';

    var $item = null;

    if (goog.userAgent.IE && goog.userAgent.VERSION < 9) {
      // Create show element for older browsers.
      $item = innerShiv(itemMarkup, false)[0];
    }
    else {
      // Create a DOM element from the markup fragment
      $item = goog.dom.htmlToDocumentFragment(itemMarkup);
    }

    // Initialize buttons
    var $playBtn = goog.dom.query('figure a', $item)[0];

    // Bind event handlers to the object
    goog.events.listen($playBtn, goog.events.EventType.CLICK, goog.bind(this.onPlayClicked, this));

    // Tag watched items
    if (item.watched) {
        goog.dom.classes.add($item, 'watched');
    }

    // Tag new episodes.
    if (item.isNew) {
        goog.dom.classes.add($item, 'new');
    }

    // Add the item to the grid
    this._grid.addItem($item);
};


/**
 * Populates the grid with episodes.
 * @param {Array} episodes The array of episodes to populate.
 */
gva.component.EpisodeGrid.prototype.setEpisodes = function(episodes) {

    this._grid.clear();

    // Populate grid
    for (var i = 0; i < episodes.length; i++) {
        this.addItem(episodes[i]);
    }
};

/**
 * Event handler for when a grid item's play button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.EpisodeGrid.prototype.onPlayClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);
};


/**
 * Export the fully qualified class name of this component for dependency
 * injection
 */
goog.exportSymbol('gva.component.EpisodeGrid', gva.component.EpisodeGrid);
