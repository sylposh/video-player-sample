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
goog.provide('gva.controller.BackgroundController');

goog.require('gva.controller.AbstractController');
/**
 * Import dependencies
 */
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');
goog.require('gva.util.Notify');



/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.BackgroundController = function() {

  // Call super constructor
  gva.controller.AbstractController.call(this);

  // The model singletons.
  this._userModel = null;
  this._dataModel = null;

  // Background check interval.
  this._checkInterval = null;

  // Time between updates in minutes.
  this.UPDATE_INTERVAL = 300;

  // Utility for new episode notifications.
  this._notifier = new gva.util.Notify();
};

/**
 * Extend gva.controller.AbstractController.
 */
goog.inherits(gva.controller.BackgroundController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.BackgroundController.prototype.initialize = function($context) {
  this.constructor.superClass_.initialize.call(this, $context);

  // Retrieve the model singletons
  this._dataModel = gva.model.DataModel.getInstance();
  this._userModel = gva.model.UserModel.getInstance();

  // Check for new episodes whenever the data model refreshes.
  goog.events.listen(this._dataModel, gva.model.DataModel.EventType.GOT_EPISODES, this.checkForNewEpisodes, false, this);

  // Convert UPDATE_INTERVAL to ms.
  var waitTime = this.UPDATE_INTERVAL * 1000 * 60;

  // Initial and repeated update requests.
  this._dataModel.getEpisodes(true);

  this._checkInterval = setInterval(goog.bind(function() {
      this._dataModel.getEpisodes(true);
    }, this), waitTime);
};


/**
 * Event handler for the episode data loaded event, dispatched from the data model.
 * @param {goog.events.Event} event An event containing episode data from the data model.
 */
gva.controller.BackgroundController.prototype.checkForNewEpisodes = function(event) {

  // See when the last check occurred.
  var lastCheckDate = new Date(this._userModel.getLastEpisodeCheck());
  var lastCheckTime = lastCheckDate.getTime();

  var newEpisodes = this._dataModel.searchEpisodesByTimestamp(lastCheckTime);

  var data = {
    'episodes': newEpisodes,
    'startDate': lastCheckTime
  };

  // Create notifications for each new episode.
  if (newEpisodes.length > 0) {
    this._notifier.showNotification('new', data);
  }


  // Update last check date.
  this._userModel.updateLastEpisodeCheck();
};


/**
 * @inheritDoc
 */
gva.controller.BackgroundController.prototype.enable = function() {
  // Call method on super class
  this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.BackgroundController.prototype.disable = function() {
  // Call method on super class
  this.constructor.superClass_.disable.call(this);
};

/**
 * Export the fully qualified class name of this controller for dependency
 * injection
 */
goog.exportSymbol('gva.controller.BackgroundController', gva.controller.BackgroundController);
