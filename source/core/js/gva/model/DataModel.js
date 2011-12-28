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
goog.provide('gva.model.DataModel');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.net.EventType');
goog.require('goog.net.Jsonp');
goog.require('goog.net.XhrIo');
goog.require('goog.testing.singleton');
goog.require('gva.model.UserModel');
goog.require('gva.util.StringUtil');
goog.require('gva.vo.EpisodesData');
goog.require('gva.vo.ShowsData');


/**
 * Creates a new DataModel instance, or returns the singleton instance.
 * @constructor
 */
gva.model.DataModel = function() {

    this._dataRequest = null;

    this._episodeBySlug = {};
    this._episodeByID = {};
    this._showBySlug = {};
    this._showByID = {};

    /**
     * @type {gva.vo.ShowsData}
     */
    this.showsData = null;

    /**
     * @type {gva.vo.EpisodesData}
     */
    this.episodesData = null;


    this.DEFAULT_CATEGORY_IMAGE = '/themes/os/img/default_thumbs/category.jpg';
    this.DEFAULT_VIDEO_IMAGE = '/themes/os/img/default_thumbs/video.jpg';
    
    // Max age for an episode to be flagged as "new" in ms (currently 1 week)
    this.NEW_EPISODE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

    // Call super constructor
    goog.events.EventTarget.call(this);
};

/**
 * Extend event dispatcher
 */
goog.inherits(gva.model.DataModel, goog.events.EventTarget);

/**
 * Enumeration for DataModel event types.
 * @enum {string}
 */
gva.model.DataModel.EventType = {
        GOT_SHOWS: 'DataModel::gotShows',
        GOT_EPISODES: 'DataModel::gotEpisodes',
        GOT_ALL_DATA: 'DataModel::gotAllData'
};

/**
 * Retrieves a list of all available shows
 */
gva.model.DataModel.prototype.getShows = function() {

    // If we already have data, dispatch the complete event
    if (this.showsData) {

        this.onDataLoaded(null);

    } else if (!this._dataRequest) {

        this.getData();
    }
};

/**
 * Retrieves all episodes
 * @param {boolean} refreshRequest If true this function will ignore existing data and request updated episode data.
 */
gva.model.DataModel.prototype.getEpisodes = function(refreshRequest) {

    // If we already have data, dispatch the complete event
    if (this.episodesData && !refreshRequest) {

        this.onDataLoaded(null);

    } else if (!this._dataRequest) {

        this.getData();
    }
};


/**
 * Requests all video/category data.
 * @param {boolean} refreshRequest If true this function will ignore existing data and request updated episode data.
 */
gva.model.DataModel.prototype.getData = function(refreshRequest) {

    var url = gva.config['data_path'] + '?v=' + new Date().getTime();

    // Allow for cross-domain data loading
    if (gva.config['jsonp'].toLowerCase() === 'true') {

        var context = this;

        this._dataRequest = new goog.net.Jsonp(url, 'callback');
        //this._episodeRequest.setRequestTimeout(60000);
        this._dataRequest.send({}, function(result) {
            // Parse the show data
            context.setData(result);
            // Trigger standard load handler
            context.onDataLoaded(null);
        }, function(error) {
            context.onLoadError(error);
            throw error;
        });

    } else {

        this._dataRequest = new goog.net.XhrIo();
        goog.events.listenOnce(this._dataRequest, goog.net.EventType.COMPLETE, goog.bind(this.onDataLoaded, this));
        goog.events.listenOnce(this._dataRequest, goog.net.EventType.ERROR, goog.bind(this.onLoadError, this));
        this._dataRequest.send(url);
    }
};

/**
 * Searches episode data for the given term and returns a list of results
 * @param {string} term The term to search for within episode data.
 * @return {Array.<gva.vo.Episode>} A list of matched episodes.
 */
gva.model.DataModel.prototype.searchEpisodes = function(term) {

    /**
     * @type {Array.<gva.vo.Episode}
     */
    var results = [];

    if (this.episodesData) {

        var episodes = this.episodesData.episodes;
        var distance;
        var episode;
        var matched;
        var index = [];

        // Remove non word characters from term
        term = term.replace(/[^\w\s\-]/g, '');

        // Strip dangerous white space
        term = term.replace(/^\s+|\s+$|\s{2,}/g, '');

        // Split words with pipes
        term = term.replace(/\s+/g, '|');

        // Build a regex for testing
        var regex = new RegExp(term, 'gi');

        for (var i = 0, n = episodes.length; i < n; i++) {

            episode = episodes[i];

            distance = 0;
            matched = false;

            // Test for match in episode title
            if (episode.title.match(regex)) {
                matched = true;
                distance += gva.util.StringUtil.levenshtein(term, episode.title) / episode.title.length;
            }

            // Test for match in show title
            if (!matched && episode.show_title.match(regex)) {
                matched = true;
                distance += (gva.util.StringUtil.levenshtein(term, episode.show_title) / episode.show_title.length);
            }

            // Test for match in episode description
            if (!matched && episode.text.match(regex)) {
                matched = true;
                distance += (gva.util.StringUtil.levenshtein(term, episode.text) / episode.text.length);
            }

            // Index if any matches were found
            if (matched) {
                index.push({
                    distance: distance,
                    data: episode
                });
            }
        }

        // Sort the index by score
        index.sort(function(a, b) {
            return a.distance - b.distance;
        });

        // Push matches into results
        for (i = 0, n = index.length; i < n; i++) {
            results[i] = index[i].data;
        }
    }

    return results;
};


/**
 * Searches episode data for new episodes since a given date.
 * @param {number} startTime The integer timestamp of the earlier episode airdate to return.
 * @return {Array} The array of episodes found.
 */
gva.model.DataModel.prototype.searchEpisodesByTimestamp = function(startTime) {

    var results = [];

    if (this.episodesData) {

        var episodes = this.episodesData.episodes;

        for (var i = 0, n = episodes.length; i < n; i++) {

            var airDate = new Date(episodes[i].airdate);
            var airTime = airDate.getTime();


            if (startTime < airTime) {
                results.push(episodes[i]);
            }
        }
    }

    return results;
};


/**
 * Searches shows data by ID and returns any matching show object
 * @param {string} id The id of the show to find.
 * @return {Object} The show object with the specified id.
 */
gva.model.DataModel.prototype.getShowByID = function(id) {
    return this._showByID[id];
};

/**
 * Searches shows data by slug and returns any matching show object
 * @param {string} slug The slug of the show to find.
 * @return {Object} The show object with the specified slug.
 */
gva.model.DataModel.prototype.getShowBySlug = function(slug) {
    return this._showBySlug[slug];
};

/**
 * Searches episode data by ID and returns any matching episode object
 * @param {string} id The id of the episode to find.
 * @return {Object} The episode object with the specified id.
 */
gva.model.DataModel.prototype.getEpisodeByID = function(id) {
    return this._episodeByID[id];
};

/**
 * Searches episode data by slug and returns any matching episode object
 * @param {string} slug The slug of the episode to find.
 * @return {Object} The episode object with the specified slug.
 */
gva.model.DataModel.prototype.getEpisodeBySlug = function(slug) {
    return this._episodeBySlug[slug];
};

/**
 * Convenience method that searches episode data to find all episodes
 * from a particular show and optionally filtering for unwatched episodes.
 * @param {string} showID The id of the show.
 * @param {Boolean} unwatched Return only unwatched episodes if true.
 * @return {Array} An array of episode objects.
 */
gva.model.DataModel.prototype.getEpisodesByShow = function(showID, unwatched) {

  // Get watched episode data.
  var userModel = gva.model.UserModel.getInstance();
  var watchedEpisodes = userModel.getWatchedEpisodes();

  // Search for unwatched episodes filtered by showID.
  var foundEpisodes = [];

  if (!this.episodesData) {
    return false;
  }

  var allEpisodes = this.episodesData.episodes;


  for (var i = 0, n = allEpisodes.length; i < n; i++) {
      if (allEpisodes[i].show_id == showID) {

        if (unwatched && (goog.array.indexOf(watchedEpisodes, allEpisodes[i].id) != -1)) {
          continue;
        }

        foundEpisodes.push(allEpisodes[i]);
      }

  }

  return foundEpisodes;
};

/**
 * Sets the current show and episode data object and updates the
 * object content based on user data from local storage
 * @param {Object} data The JSON data object for the shows and episodes.
 */
gva.model.DataModel.prototype.setData = function(data) {
    var categories = [];
    var episodes = [];

    // Retrieve the watched episodes from local storage
    var userModel = gva.model.UserModel.getInstance();
    var subscribed = userModel.getUserSubscriptions();
    var watched = userModel.getWatchedEpisodes();

    var now = new Date();

    var i, j, n, m, categoryData, episodeData, category, episode, lastUpdated;

    for (i = 0, n = data['categories'].length; i < n; i++) {

        categoryData = data['categories'][i];

        category = {
            'id' : categoryData['id'],
            'title' : categoryData['title'],
            'description' : categoryData['description'],
            'image_url' : categoryData['image_url']
        };

        if (category['image_url'].length == 0) {
          category['image_url'] = this.DEFAULT_CATEGORY_IMAGE;
        }

        if (subscribed && goog.array.contains(subscribed, category['id'])) {
            category['subscribed'] = true;
        } else {
            category['subscribed'] = false;
        }

        category['slug'] = gva.util.StringUtil.slugify(category['title']);

        for (j = 0, m = categoryData['episodes'].length; j < m; j++) {

            episodeData = categoryData['episodes'][j];

            episode = {
                'id' : episodeData['id'],
                'title' : episodeData['title'],
                'description' : episodeData['description'],
                'image_url' : episodeData['image_url'],
                'airdate' : episodeData['airdate'],
                'runtime' : episodeData['runtime'],
                'show_id' : category['id'],
                'show_title' : category['title'],
                'video_html' : episodeData['video_html'],
                'video_flash' : episodeData['video_flash']
            };

            if (episode['image_url'].length == 0) {
              episode['image_url'] = this.DEFAULT_VIDEO_IMAGE;
            }

            if (watched && goog.array.contains(watched, episode['id'])) {
                episode['watched'] = true;
            } else {
                episode['watched'] = false;
            }

            // Mark new episode if under one week old.
            var airdate = new Date(episode['airdate']);

            if (airdate > lastUpdated || !lastUpdated) {
              lastUpdated = airdate;
            }

            if ((now.getTime() - airdate.getTime()) < this.NEW_EPISODE_MAX_AGE) {
              episode['isNew'] = true;
            }
            else {
              episode['isNew'] = false;
            }

            // Cache the episode slug
            episode['slug'] = gva.util.StringUtil.slugify(episode['title']);

            episodes.push(episode);
        }

        category['videocount'] = categoryData['episodes'].length;
        category['latestvideodate'] = lastUpdated;

        categories[i] = category;
    }

    this.showsData = new gva.vo.ShowsData({
        'categories' : categories
    });

    this.episodesData = new gva.vo.EpisodesData({
        'episodes' : episodes
    });

    // Index the show by ID and slug.
    for (i = 0, n = this.showsData.shows.length; i < n; i++) {

      category = this.showsData.shows[i];

      this._showBySlug[category.slug] = category;
      this._showByID[category.id] = category;
    }

    // Index the episodes by ID and slug.
    for (i = 0, n = this.episodesData.episodes.length; i < n; i++) {

        episode = this.episodesData.episodes[i];

        this._episodeBySlug[episode.slug] = episode;
        this._episodeByID[episode.id] = episode;
    }
};

/**
 * Event handler for a data loading error
 * @param {goog.events.Event=} event The error event.
 */
gva.model.DataModel.prototype.onLoadError = function(event) {
    //console.log('Load Error', event);
};


/**
 * Event handler for when data is loaded.
 * @param {goog.events.Event=} event The event containing the response data.
 */
gva.model.DataModel.prototype.onDataLoaded = function(event) {

    // The request is now redundant
    this._dataRequest = null;

    // Store the episode data if it doesn't yet exist
    if (!this.showsData && event !== null) {
        var data = goog.json.parse(event.target.getResponseText());
        this.setData(data);
    }

    // Create new events
    var showEvent = new goog.events.Event(gva.model.DataModel.EventType.GOT_SHOWS);
    var episodeEvent = new goog.events.Event(gva.model.DataModel.EventType.GOT_EPISODES);
    var dataEvent = new goog.events.Event(gva.model.DataModel.EventType.GOT_ALL_DATA);

    // Reference the data in the events
    showEvent.data = this.showsData;
    episodeEvent.data = this.episodesData;
    dataEvent.data = this.data;


    // Dispatch the events to subscribers
    this.dispatchEvent(showEvent);
    this.dispatchEvent(episodeEvent);
    this.dispatchEvent(dataEvent);
};


// Use singleton pattern and create a static getInstance method on the model
goog.addSingletonGetter(gva.model.DataModel);
