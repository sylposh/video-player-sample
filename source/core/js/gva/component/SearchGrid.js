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
goog.provide('gva.component.SearchGrid');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.dataset');
goog.require('goog.events');
goog.require('goog.math.Rect');
goog.require('goog.style');

goog.require('gva.component.BaseComponent');
goog.require('gva.component.FlexibleGrid');

goog.require('gva.util.StringUtil');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.SearchGrid = function() {

    /**
     * The flexible grid for arranging items.
     * @type {gva.component.FlexibleGrid}
     */
    this._grid = new gva.component.FlexibleGrid();


    // The episode grid instance used for play events.
    this._episodeGrid = null;

    // Call super constructor
    gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.SearchGrid, gva.component.BaseComponent);

/**
 * @inheritDoc
 */
gva.component.SearchGrid.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    // Get the episode grid instance.
    this._episodeGrid = gva.component.ComponentInitializer.getComponentByQuery('.episode-grid');

    // Set up the fixed grid cell size.
    this._grid.initialize($context, 210, 180, 12, 55);
};

/**
 * Creates a DOM element for an item and appends it to the grid
 * @param {gva.vo.Episode} item The data for the item to add.
 */
gva.component.SearchGrid.prototype.addItem = function(item) {

    // Format the date
    var date = new Date(item.airdate);
    var dateStr = gva.util.DateUtil.formatDate(date, 'M j, Y');

    // Create markup for the grid item
    var itemMarkup = '' +
    '<article class="episode" data-episodeid="' + item.id + '">' +
        '<figure>' +
            '<a href="/home/' + item.slug + '" title="' + item.title + '" data-episodeid="' + item.id + '">' +
                '<img src="' + item.image_url + '"/>' +
                '<span>Play</span>' +
            '</a>' +
        '</figure>' +
        '<header>' +
            '<h3>' + item.title + '</h3>' +
        '</header>' +
        '<p>Episode ' + item.episode_number + ' / ' + item.season + '</p>' +
        '<footer>' +
            '<p>' + dateStr + '</p>' +
            '<a class="show-link" href="#"><span class="icon"></span>' + item.show_title + '</a>' +
        '</footer>' +
    '</article>';

    // Create a DOM element from the markup fragment
    var $item = goog.dom.htmlToDocumentFragment(itemMarkup);

    // Initialize buttons
    var $playBtn = goog.dom.query('figure a', $item)[0];
    var $showBtn = goog.dom.query('a.show-link', $item)[0];

    // Set show link.
    var showSlug = gva.util.StringUtil.slugify(item.show_title);
    goog.dom.setProperties($showBtn, {title: item.show_title, href: '/shows/' + showSlug + '/'});

    // Bind event handlers to the object
    goog.events.listen($playBtn, goog.events.EventType.CLICK, goog.bind(this.onPlayClicked, this));
    goog.events.listen($showBtn, goog.events.EventType.CLICK, goog.bind(this.onShowClicked, this));

    // Tag watched items
    if (item.watched) {
        goog.dom.classes.add($item, 'watched');
    }

    // Add the item to the grid
    this._grid.addItem($item);
};


/**
 * Passes results into to search grid drop down display.
 * @param {Array.<gva.vo.Episode>} results The data for the episodes to add.
 */
gva.component.SearchGrid.prototype.setResults = function(results) {

    this._grid.clear();

    // Populate grid
    for (var i = 0; i < results.length; i++) {
        this.addItem(results[i]);
    }
};

/**
 * Event handler for when a grid item's play button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchGrid.prototype.onPlayClicked = function(event) {
    event.preventDefault();

    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);
};


/**
 * Event handler for when a grid item's show link button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchGrid.prototype.onShowClicked = function(event) {

    event.preventDefault();

    // Get the show page info and go there.
    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);

};


/**
 * Export the fully qualified class name of this component for dependency
 * injection
 */
goog.exportSymbol('gva.component.SearchGrid', gva.component.SearchGrid);
