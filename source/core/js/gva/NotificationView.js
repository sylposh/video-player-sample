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
 * Initialize namespace.
 */
var gva = gva || {};
gva.views = gva.views || {};

/**
 * Formats and constructs the notifications.
 * @constructor
 */
gva.views.NotificationView = function() {

  // Determine which type of notification we should display and fire it off.
  this.type = this.getParameterByName('type');

  this.BASE_HEIGHT = 90;
  this.TITLE_HEIGHT = 20;

  if (this.type == 'episode') {
    this.populateEpisode();
  }
  else if (this.type == 'new') {
    this.populateNewEpisodes();
  }

};


/**
 * Reads the query string for episode information that will be displayed in the notification.
 */
gva.views.NotificationView.prototype.populateEpisode = function() {

  document.body.className = 'now-showing';

  // Get episode info from the query string.

  var thumb = this.getParameterByName('thumb'),
  title = this.getParameterByName('title'),
  airdate = this.getParameterByName('airdate');

  // Create the markup for the notification.

  var episodeDetails = document.createElement('article');

  episodeDetails.innerHTML = '' +
    '<article class="episode">' +
      '<h4>Now Showing</h4>' +
      '<figure>' +
        '<img src="' + thumb + '" />' +
      '</figure>' +
      '<h2>' + title + '</h2>' +
      '<p class="airdate">Date: ' + airdate + '</p>' +
    '</article>';

  document.body.appendChild(episodeDetails);

  // Adjust height to fit longer titles.
  var titleHeight = document.getElementsByTagName('h2')[0].offsetHeight;

  if (titleHeight > this.TITLE_HEIGHT) {
    document.body.style.height = this.BASE_HEIGHT + (titleHeight - this.TITLE_HEIGHT) + 'px';
  }
};


/**
 * Reads the query string for new episode information that will be displayed in the notification.
 */
gva.views.NotificationView.prototype.populateNewEpisodes = function() {

  document.body.className = 'new-episodes';

  // Get episode info from the query string.
  var count = this.getParameterByName('count'),
  thumb = this.getParameterByName('thumb'),
  title = this.getParameterByName('title'),
  slug = this.getParameterByName('slug');
  showSlug = this.getParameterByName('showSlug');
  startDate = this.getParameterByName('startDate');
  airdate = this.getParameterByName('airdate');
  baseURL = this.getParameterByName('baseURL');


  // max length for trimming title.
  var maxLength = 31;

  // Create the markup for the notification.

  var newEpisodesNotification = document.createElement('div');
  newEpisodesNotification.className = 'container';

  var markup = '' +
    '<header class="new">' +
      '<h3>New Videos<span class="count">' + count + '</span></h3>' +
    '</header>' +
    '<article class="episode">' +
      '<figure>' +
        '<img src="' + thumb + '" />' +
      '</figure>' +
      '<h2>' + title + '</h2>' +
      '<p class="airdate">Date: ' + airdate + '</p>' +
      '<div class="mask"></div>' +
      '<a class="play" href="' + baseURL + '#/home/' + slug + '/" target="_blank" alt="Play"></a>' +
    '</article>' +
    '<footer>' +
      '<h3>' +
        '<a href="' + baseURL + '#/search/new/' + startDate + '/" target="_blank">' +
          '<span class="icon"></span>Show all new Videos' +
        '</a>' +
      '</h3>' +
    '</footer>';

  newEpisodesNotification.innerHTML = markup;

  document.body.appendChild(newEpisodesNotification);
};


/**
 * Tries to get a query string parameter.
 * @param {String} name The parameter name.
 * @return {String} The contents of any parameter successfully retrieved.
 */
gva.views.NotificationView.prototype.getParameterByName = function(name) {

  name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');

  var regexS = '[\\?&]' + name + '=([^&#]*)';
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);

  if (results == null) {
    return '';
  }
  else {
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  }
};


// Create the instance.
gva.notification = new gva.views.NotificationView();
