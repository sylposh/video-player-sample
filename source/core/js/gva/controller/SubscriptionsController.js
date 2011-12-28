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
goog.provide('gva.controller.SubscriptionsController');

/**
 * Import dependencies
 */
goog.require('goog.fx.Animation');
goog.require('goog.style');

goog.require('gva.component.ComponentInitializer');
goog.require('gva.component.Subscriptions');
goog.require('gva.controller.AbstractController');
goog.require('gva.easing');
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.SubscriptionsController = function() {

    this._subscriptions = null;

    this._subscriptionData = null;

    this._userModel = null;
    this._dataModel = null;


    // Call super constructor
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController
 */
goog.inherits(gva.controller.SubscriptionsController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.SubscriptionsController.prototype.initialize = function($context) {

    // Call super initialize method
    this.constructor.superClass_.initialize.call(this, $context);

    // Get the subscriptions component instance.
    this._subscriptions = gva.component.ComponentInitializer.getComponentByQuery('#subscriptions');


    // Retrieve the model singletons
    this._dataModel = gva.model.DataModel.getInstance();
    this._userModel = gva.model.UserModel.getInstance();

    // Populate with loaded data.
    this.onDataLoaded();

    // Listen for when a show is subscribed to or unsubscribed from
    goog.events.listen(this._userModel, gva.model.UserModel.EventType.SUBSCRIPTION_ADDED, this.onSubscriptionChanged, false, this);
    goog.events.listen(this._userModel, gva.model.UserModel.EventType.SUBSCRIPTION_REMOVED, this.onSubscriptionChanged, false, this);
    goog.events.listen(this._userModel, gva.model.UserModel.EventType.EPISODE_WATCHED, this.onEpisodeWatched, false, this);
};


/**
 * @inheritDoc
 */
gva.controller.SubscriptionsController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
};


/**
 * @inheritDoc
 */
gva.controller.SubscriptionsController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
};



/**
 * Event handler for initial population of subscription list when show data is available.
 * @param {goog.events.Event} event An event containing the show data that has been loaded.
 */
gva.controller.SubscriptionsController.prototype.onDataLoaded = function(event) {

    // Retrieve subscription list.
    var subscriptions = this._userModel.getUserSubscriptions();

    // Populate the subscriptions component list.
    for (var i = 0, n = subscriptions.length; i < n; i++) {
      var show = this._dataModel.getShowByID(subscriptions[i]);
      if (show) {
        this._subscriptions.addItem(show);
      }
    }
};


/**
 * Event handler for a show subscription changing in the user model
 * @param {goog.events.Event} event An event containing the show which has changed.
 */
gva.controller.SubscriptionsController.prototype.onSubscriptionChanged = function(event) {
  var show = event.data;

  if (event.type == gva.model.UserModel.EventType.SUBSCRIPTION_ADDED) {
    this._subscriptions.addItem(show);
  }
  else {
    this._subscriptions.removeItem(show.id);
  }
};


/**
 * Event handler for an episode being marked as watched in the user model
 * @param {goog.events.Event} event An event containing the episode data of the watched episode.
 */
gva.controller.SubscriptionsController.prototype.onEpisodeWatched = function(event) {
  this._subscriptions.updateUnwatchedCount(event.data.show_id);
};

/**
 * Export the fully qualified class name of this controller for dependency injection.
 */
goog.exportSymbol('gva.controller.SubscriptionsController', gva.controller.SubscriptionsController);
