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
goog.provide('gva.controller.ShowController');

/**
 * Import dependencies
 */
goog.require('goog.fx.Animation');
goog.require('goog.style');

goog.require('gva.component.ComponentInitializer');
goog.require('gva.component.EpisodeGrid');
goog.require('gva.component.ShowDetails');
goog.require('gva.component.ShowGrid');
goog.require('gva.controller.AbstractController');
goog.require('gva.easing');
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');
goog.require('gva.vo.EpisodesData');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.ShowController = function() {

    this._showGrid = null;
    this._showDetails = null;
    this._episodeGrid = null;
    /**
     * @type {Array.<gva.vo.Show>}
     */
    this._showData = null;
    this._currentShow = null;
    /**
     * @type {gva.vo.EpisodesData}
     */
    this._episodeData = null;
    this._awaitingData = false;
    this._urlSegments = null;

    this._transition = null;
    this._subsection = true;

    this._$showTitle = null;
    this._$backBtn = null;

    this._callbacks = null;

    // Call super constructor
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController
 */
goog.inherits(gva.controller.ShowController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.ShowController.prototype.initialize = function($context) {

    // Call super initialize method
    this.constructor.superClass_.initialize.call(this, $context);

    // Find the heading which we'll populate when browsing show information
    this._$showTitle = goog.dom.query('.details header h2', this.$context)[0];
    this._$backBtn = goog.dom.query('.details a.back', this.$context)[0];

    // Retrieve component references from the component initializer
    this._showGrid = gva.component.ComponentInitializer.getComponentByQuery('.show-grid');
    this._episodeGrid = gva.component.ComponentInitializer.getComponentByQuery('.episode-grid');
    this._showDetails = gva.component.ComponentInitializer.getComponentByQuery('.show-details');

    // Bind events
    this.addEventListeners();
};


/**
 * Adds event listeners for show components.
 */
gva.controller.ShowController.prototype.addEventListeners = function() {

    // Create scoped callbacks
    this._callbacks = {
            onAllDataLoaded: goog.bind(this.onAllDataLoaded, this),
            onShowDataLoaded: goog.bind(this.onShowDataLoaded, this),
            onEpisodeDataLoaded: goog.bind(this.onEpisodeDataLoaded, this),
            onShowDetailsResize: goog.bind(this.onShowDetailsResize, this),
            onSubscriptionChanged: goog.bind(this.onSubscriptionChanged, this),
            onEpisodeSelected: goog.bind(this.onEpisodeSelected, this),
            onEpisodeWatched: goog.bind(this.onEpisodeWatched, this),
            onBackClicked: goog.bind(this.onBackClicked, this)
    };

    // Retrieve the model singletons
    var dataModel = gva.model.DataModel.getInstance();
    var userModel = gva.model.UserModel.getInstance();

    // Listen for back button clicks
    goog.events.listen(this._$backBtn, goog.events.EventType.CLICK, this._callbacks.onBackClicked);

    // Listen for height change events on the details component
    this._showDetails.addEventListener(gva.component.ShowDetails.EventType.RESIZE, this._callbacks.onShowDetailsResize, false, this);


    // Retrieve show and episode data from the model
    this._callbacks.onAllDataLoaded();

    // Listen for when a show is subscribed to or unsubscribed from
    goog.events.listen(userModel, gva.model.UserModel.EventType.SUBSCRIPTION_ADDED, this._callbacks.onSubscriptionChanged);
    goog.events.listen(userModel, gva.model.UserModel.EventType.SUBSCRIPTION_REMOVED, this._callbacks.onSubscriptionChanged);
    goog.events.listen(userModel, gva.model.UserModel.EventType.EPISODE_WATCHED, this._callbacks.onEpisodeWatched);
};

/**
 * @inheritDoc
 */
gva.controller.ShowController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.ShowController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
};

/**
 * Tells the controller to handle deep linking beyond the top level section depth.
 * @param {Array.<string>} segments A list of URL fragments beyond the root level.
 * @param {boolean=} instant If true, no transition will be applied.
 */
gva.controller.ShowController.prototype.navigate = function(segments, instant) {

    this._urlSegments = segments;

    // Create a recyclable transition animation
    if (!this._transition) {

        this._transition = new goog.fx.Animation([0], [1], 450, gva.easing.quintic.easeOut);

        var events = [];

        // Subscribe to the progress and end animation events
        events.push(goog.fx.Animation.EventType.ANIMATE);
        events.push(goog.fx.Animation.EventType.END);

        var self = this;

        goog.events.listen(this._transition, events, function() {

            // Calculate where the container should be
            var percent = self._transition.coords[0] * 100;
            if (!self._subsection) {
                percent = 100 - percent;
            }

            // Update the container position
            goog.style.setStyle(self.$context, 'left', '-' + percent + '%');
        });
    }

    // Set the transition duration
    this._transition.duration = instant ? 1 : 450;

    // Set the direction of the animation
    this._subsection = segments.length > 0;

    if (this._subsection) {

        var model = gva.model.DataModel.getInstance();
        var show = model.getShowBySlug(segments[0]);

        if (show) {

            // Store the current show
            this._currentShow = show;

            // Update the section title and show information
            goog.dom.setTextContent(this._$showTitle, show.title);
            this._showDetails.setShow(show);

            // Filter episodes by show and pass to the episode grid
            if (this._episodeData) {
                this.refreshEpisodeData();
            } else {
                this._awaitingData = true;
            }

            // Enable the back button
            var $backBtn = this._$backBtn;
            setTimeout(function() {
              goog.dom.classes.add($backBtn, 'enabled');
            }, 500);

            // Retrieve the episode for this slug, if present
            if (segments[1]) {
                var episode = model.getEpisodeBySlug(segments[1]);
            }

        } else {
            //console.log('invalid show URL');
        }

    } else {
        // Disable the back button
        goog.dom.classes.remove(this._$backBtn, 'enabled');
    }

    // Play the animation
    this._transition.play(true);
};

/**
 * Refreshes the episode grid with the current episode data
 */
gva.controller.ShowController.prototype.refreshEpisodeData = function() {

    if (this._currentShow) {

        var showEpisodes = [];
        var allEpisodes = this._episodeData.episodes;
        for (var i = 0, n = allEpisodes.length; i < n; i++) {
            if (allEpisodes[i].show_id === this._currentShow.id) {
                showEpisodes.push(allEpisodes[i]);
            }
        }

        this._episodeGrid.setEpisodes(showEpisodes);
    }
};

/**
 * Event handler for the resize event dispatched by the show details component
 * @param {goog.events.Event} event The event which triggered this handler.
 */
gva.controller.ShowController.prototype.onShowDetailsResize = function(event) {
    // Push the grid down by the current height of the details container
    var offset = this._showDetails.currentHeight;
    if (offset > 0) {
        offset -= 25;
    }
    goog.style.setStyle(this._episodeGrid.$context, 'margin-top', offset + 'px');
};


/**
 * Event handler for when all episode/show data is ready.
 * @param {goog.events.Event} event The event which triggered this handler.
 */
gva.controller.ShowController.prototype.onAllDataLoaded = function(event) {

    // Retrieve data from the model
    var model = gva.model.DataModel.getInstance();
    this._showData = model.showsData.shows;
    this._episodeData = model.episodesData;

    for (var i = 0, n = this._showData.length; i < n; i++) {
        this._showGrid.addItem(this._showData[i]);
    }

    // Initialize drag/drop elements now that all shows have been loaded.
    this._showGrid.initDragDrop();

    // Initialise episodes
    if (this._awaitingData) {
        this.refreshEpisodeData();
    }
};

/**
 * Event handler for the show data loaded event, dispatched from the data model
 * @param {goog.events.Event} event An event containing show data from the data model.
 */
gva.controller.ShowController.prototype.onShowDataLoaded = function(event) {
    // Add every show to the show grid
    this._showData = event.data.shows;
    for (var i = 0, n = this._showData.length; i < n; i++) {
        this._showGrid.addItem(this._showData[i]);
    }

    // Initialize drag/drop elements now that all shows have been loaded.
    this._showGrid.initDragDrop();
};

/**
 * Event handler for the episode data loaded event, dispatched from the data model
 * @param {goog.events.Event} event An event containing episode data from the data model.
 */
gva.controller.ShowController.prototype.onEpisodeDataLoaded = function(event) {
    this._episodeData = event.data;
    if (this._awaitingData) {
        this.refreshEpisodeData();
    }
};

/**
 * Event handler for a show subscription changing in the user model
 * @param {goog.events.Event} event An event containing the show which has changed.
 */
gva.controller.ShowController.prototype.onSubscriptionChanged = function(event) {

    // Refresh the show grid and it's data
    this._showGrid.refresh(this._showData);

    // Refresh the show details view
    this._showDetails.refresh();
};

/**
 * Event handler for an episode being selected from the episode grid
 * @param {goog.events.Event} event An event containing the episode ID of the selected episode.
 */
gva.controller.ShowController.prototype.onEpisodeSelected = function(event) {
    var model = gva.model.DataModel.getInstance();
    var episode = model.getEpisodeByID(event.id);
    gva.controller.ApplicationController.navigate('/home/' + episode.slug + '/');
};

/**
 * Event handler for an episode being marked as watched in the user model
 * @param {goog.events.Event} event An event containing the episode data of the watched episode.
 */
gva.controller.ShowController.prototype.onEpisodeWatched = function(event) {
    // Refresh the episode grid and it's data
    this._episodeGrid.refresh(this._episodeData.episodes);
};

/**
 * Event handler for the back to show button click event
 * @param {goog.events.BrowserEvent} event The event which triggered this handler.
 */
gva.controller.ShowController.prototype.onBackClicked = function(event) {
    event.preventDefault();
    // Go back to shows section
    gva.controller.ApplicationController.navigate('/shows/');
};

/**
 * Export the fully qualified class name of this controller for dependency injection.
 */
goog.exportSymbol('gva.controller.ShowController', gva.controller.ShowController);
