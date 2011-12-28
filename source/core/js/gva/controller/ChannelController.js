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
goog.provide('gva.controller.ChannelController');

goog.require('gva.component.Channel');
goog.require('gva.component.EpisodeGrid');
goog.require('gva.component.SearchForm');
goog.require('gva.controller.AbstractController');
/**
 * Import dependencies
 */
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.ChannelController = function() {

    // Call super constructor
    gva.controller.AbstractController.call(this);

    // The channel component instance.
    this._channel = null;

    // The video player component instance.
    this._player = null;


    this._userModel = null;
    this._dataModel = null;
    this._episodeGrid = null;
    this._searchForm = null;
};

/**
 * Extend gva.controller.AbstractController.
 */
goog.inherits(gva.controller.ChannelController,
        gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.ChannelController.prototype.initialize = function($context) {

    this.constructor.superClass_.initialize.call(this, $context);

    // Retrieve component instances.
    this._channel = gva.component.ComponentInitializer.getComponentByQuery('#channel');
    this._episodeGrid = gva.component.ComponentInitializer.getComponentByQuery('.episode-grid');
    this._searchForm = gva.component.ComponentInitializer.getComponentByQuery('#search-form');
    this._player = gva.component.ComponentInitializer.getComponentByQuery('#video-player');

    this._channel.setPlayer(this._player);

    // Retrieve the model singletons
    this._dataModel = gva.model.DataModel.getInstance();
    this._userModel = gva.model.UserModel.getInstance();

    // Initial population.
    this.refreshChannel();

    // Listen for subscription changes.
    goog.events.listen(this._userModel, gva.model.UserModel.EventType.SUBSCRIPTION_ADDED, this.refreshChannel, false, this);
    goog.events.listen(this._userModel, gva.model.UserModel.EventType.SUBSCRIPTION_REMOVED, this.refreshChannel, false, this);

    // Listen for refresh requests from component.
    goog.events.listen(this._channel, gva.component.Channel.EventType.REFRESH_REQUESTED, this.refreshChannel, false, this);
};


/**
 * Refreshes the channel episodes to the current list of unwatched subscription episodes.
 */
gva.controller.ChannelController.prototype.refreshChannel = function() {

  // Empty the channel.
  this._channel.reset();

  // Get subscription list.
  var subscriptions = this._userModel.getUserSubscriptions();

  // Get unwatched episodes from subscribed shows.
  var i, episodes = [];
  for (i = 0, n = subscriptions.length; i < n; i++) {
    episodes = episodes.concat(this._dataModel.getEpisodesByShow(subscriptions[i], true));
  }

  // Add episodes to channel component.
  for (i = 0, n = episodes.length; i < n; i++) {
      this._channel.addEpisode(episodes[i]);
  }

};


/**
 * Handler for when episodes are played from outside the channel.
 * @param {goog.events.Event} event An event containing the episode ID of the selected episode.
 */
gva.controller.ChannelController.prototype.onEpisodeRemotePlay = function(event) {

  // Add episode to channel if not present.
  if (typeof this._channel.episodeData[event['id']] == 'undefined') {
    var episode = this._dataModel.getEpisodeByID(event['id']);
    this._channel.addEpisode(episode);
  }

  // Return to player and watch selected episode.
  this._channel.playEpisode(this._channel.episodeData[event['id']]);
  gva.controller.ApplicationController.navigate('/home/' + event['slug']);

};

/**
 * @inheritDoc
 */
gva.controller.ChannelController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
    if (this._player._paused) {
      this._player.play();
    }
};

/**
 * @inheritDoc
 */
gva.controller.ChannelController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
    this._player.pause();
};

/**
 * Tells the controller to handle deep linking beyond the top level section depth.
 * @param {Array.<string>} segments A list of URL fragments beyond the root level.
 * @param {boolean=} instant If true, no transition will be applied.
 */
gva.controller.ChannelController.prototype.navigate = function(segments, instant) {
  if (segments.length > 0) {

    var slug = segments[0];

    // Remove non word characters from slug
    slug = slug.replace(/[^\w\s\-]/g, '');

    // Strip dangerous white space
    slug = slug.replace(/^\s+|\s+$|\s{2,}/g, '');

    var episode = this._dataModel.getEpisodeBySlug(slug);

    // Add to channel if necessary.
    if (!this._channel.episodeData[episode['id']]) {
      this._channel.addEpisode(episode);
    }

    this._channel.playEpisode(episode);
  }
};

/**
 * Export the fully qualified class name of this controller for dependency
 * injection
 */
goog.exportSymbol('gva.controller.ChannelController', gva.controller.ChannelController);
