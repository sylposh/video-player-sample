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
goog.provide('gva.model.UserModel');

/**
 * Import dependencies
 */
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.testing.singleton');

/**
 * Creates a new UserModel instance, or returns the singleton instance.
 * @constructor
 */
gva.model.UserModel = function() {
    //localStorage.clear();
    // Call super constructor
    goog.events.EventTarget.call(this);
};

/**
 * Enumeration for UserModel local storage tokens.
 * @enum {string}
 */
gva.model.UserModel.TOKEN_SUBSCRIPTIONS = 'userSubscriptions';

/**
 * Enumeration for UserModel local storage tokens.
 * @enum {string}
 */
gva.model.UserModel.TOKEN_WATCHED_EPISODES = 'watchedEpisodes';

/**
 * Enumeration for UserModel local storage tokens.
 * @enum {string}
 */
gva.model.UserModel.TOKEN_LAST_EPISODE_CHECK = 'lastEpisodeCheck';

/**
 * Enumeration for event types dispatched from this class
 */
gva.model.UserModel.EventType = {
        /**
         * Dispatched when a user subscribes to a show
         */
        SUBSCRIPTION_ADDED: 'UserModel::subscriptionAdded',
        /**
         * Dispatched when a user unsubscribes from a show
         */
        SUBSCRIPTION_REMOVED: 'UserModel::subscriptionRemoved',
        /**
         * Dispatched when a user has watched an episode
         */
        EPISODE_WATCHED: 'UserModel::episodeWatched'
};

/**
 * Extend event dispatcher
 */
goog.inherits(gva.model.UserModel, goog.events.EventTarget);

/**
 * Retrieves a token from local storage and returns the parsed data
 * @param {string} token The name of the token to retrieve.
 * @return {Array} The data stored under the given token.
 */
gva.model.UserModel.prototype.getDataAtToken = function(token) {

    // Only proceed if we have access to local storage
    if (!Modernizr.localstorage) { return null; }

    var data;

    // If the item doesn't yet exist, create it
    if (!localStorage.getItem(token)) {
        data = [];
        localStorage.setItem(token, goog.json.serialize(data));
    }

    // Return the parsed storage item
    data = localStorage.getItem(token);
    return goog.json.parse(data);
};

/**
 * Pushes data into a given token
 * @param {string} token The token to add data to.
 * @param {Object} data The data to add to the given token.
 */
gva.model.UserModel.prototype.addValueToToken = function(token, data) {

    // Only proceed if we have access to local storage
    if (!Modernizr.localstorage) { return; }

    var current = this.getDataAtToken(token);

    if (!goog.array.contains(current, data)) {
        current.push(data);
    }

    // Return the modified data to local storage
    localStorage.setItem(token, goog.json.serialize(current));
};

/**
 * Removes a value from a given token
 * @param {string} token The token to remove data from.
 * @param {Object} data The item to remove from the given token.
 */
gva.model.UserModel.prototype.removeValueFromToken = function(token, data) {

    // Only proceed if we have access to local storage
    if (!Modernizr.localstorage) { return; }

    var current = this.getDataAtToken(token);
    goog.array.remove(current, data);

    // Return the modified data to local storage
    localStorage.setItem(token, goog.json.serialize(current));
};

/**
 * Retrieves a list of show IDs representing the user's subscriptions.
 * @return {Array.<string>} A list of show IDs representing the user's subscriptions.
 */
gva.model.UserModel.prototype.getUserSubscriptions = function() {
    return this.getDataAtToken(gva.model.UserModel.TOKEN_SUBSCRIPTIONS);
};

/**
 * Subscribes the user to a show.
 * @param {string} showID The ID of the show to subscribe the user to.
 */
gva.model.UserModel.prototype.addUserSubscription = function(showID) {

    // Add the subscription to local storage
    this.addValueToToken(gva.model.UserModel.TOKEN_SUBSCRIPTIONS, showID);

    // Update the data in the model
    var dataModel = gva.model.DataModel.getInstance();
    var show = dataModel.getShowByID(showID);
    show.subscribed = true;
    // console.log('added sub to data model');

    // Notify observers that data has changed
    var event = new goog.events.Event(gva.model.UserModel.EventType.SUBSCRIPTION_ADDED);
    event.data = show;

    this.dispatchEvent(event);
};

/**
 * Unsubscribes the user from a given show.
 * @param {string} showID The ID of the show to unsubscribe from.
 */
gva.model.UserModel.prototype.removeUserSubscription = function(showID) {

    // Remove the subscription to local storage
    this.removeValueFromToken(gva.model.UserModel.TOKEN_SUBSCRIPTIONS, showID);

    // Update the data in the model
    var dataModel = gva.model.DataModel.getInstance();
    var show = dataModel.getShowByID(showID);
    show.subscribed = false;

    // Notify observers that data has changed
    var event = new goog.events.Event(gva.model.UserModel.EventType.SUBSCRIPTION_REMOVED);
    event.data = show;

    this.dispatchEvent(event);
};

/**
 * Retrieves a list of the episodes a user has already watched
 * @return {Array.<string>} A list of episode IDs.
 */
gva.model.UserModel.prototype.getWatchedEpisodes = function() {
    return this.getDataAtToken(gva.model.UserModel.TOKEN_WATCHED_EPISODES);
};

/**
 * Marks a given episode as watched
 * @param {string} episodeID The ID of the episode to mark as watched.
 */
gva.model.UserModel.prototype.setWatchedEpisode = function(episodeID) {

    // Store this episode as watched in local storage
    this.addValueToToken(gva.model.UserModel.TOKEN_WATCHED_EPISODES, episodeID);

    // Update the data in the model
    var dataModel = gva.model.DataModel.getInstance();
    var episode = dataModel.getEpisodeByID(episodeID);
    episode['watched'] = true;

    // Notify observers that data has changed
    var event = new goog.events.Event(gva.model.UserModel.EventType.EPISODE_WATCHED);
    event.data = episode;

    this.dispatchEvent(event);
};

/**
 * Retrieves the time of the last time the user requested episode data.
 * @return {Date} The date of the last check.
 */
gva.model.UserModel.prototype.getLastEpisodeCheck = function() {
    return localStorage.getItem(gva.model.UserModel.TOKEN_LAST_EPISODE_CHECK);
};

/**
 * Sets the last episode check time to the current time.
 */
gva.model.UserModel.prototype.updateLastEpisodeCheck = function() {
    var now = new Date();
    localStorage.setItem(gva.model.UserModel.TOKEN_LAST_EPISODE_CHECK, now);
};

// Use singleton pattern and create a static getInstance method on the model
goog.addSingletonGetter(gva.model.UserModel);
