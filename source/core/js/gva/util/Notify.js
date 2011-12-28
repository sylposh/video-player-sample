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
goog.provide('gva.util.Notify');

goog.require('gva.util.DateUtil');
/**
 * Import dependencies
 */
goog.require('gva.util.StringUtil');
goog.require('gva.vo.Episode');

/**
 * Creates a new Notify instance.
 * @constructor
 */
gva.util.Notify = function() {

  // Constants for notifications API
  this.PERMISSION_ALLOWED = 0;
  this.PERMISSION_NOT_ALLOWED = 1;
  this.PERMISSION_DENIED = 2;

  /// Duration of notification (ms).
  this.DURATION = 5000;

  // Whether or not the browser is capable of sending notifications.
  this.notifySupported = window.webkitNotifications;

  // The notification object.
  this.notification = null;

  // The timeout used to close the notification
  this.closeTimer = null;
};

/**
 * Checks user permission.
 * @return {Boolean} True if user has allowed notiifcations, false if user has denied or not supplied a preference.
 */
gva.util.Notify.prototype.hasPermission = function() {
  return window.webkitNotifications.checkPermission() === this.PERMISSION_ALLOWED;
};

/**
 * Requests user permission to display notifications.
 * @param {function} callback The function to call if user accepts the request.
 */
gva.util.Notify.prototype.requestPermission = function(callback) {
  window.webkitNotifications.requestPermission(callback);
};

/**
 * Creates a notification with the supplied content.
 * NOTE: This method will fail if it is not triggered by a user event.
 * @param {String} type The type of notification (episode is the only one currently available).
 * @param {=vo.gva.Episode} data The data object with parameters specific to the type of notification.
 */
gva.util.Notify.prototype.showNotification = function(type, data) {

  if (!this.notifySupported) {
   return;
  }

  // Kill any other currently displayed notifications.
  if (this.notification) {
    this.notification.cancel();
    this.notification = null;
    clearTimeout(this.closeTimer);
  }

  if (this.hasPermission()) {

    this.notification = null;

    // Build the query string.

    var q = '';
    var episode = null;

    if (type == 'episode') {

      episode = data;
      q = '?type=episode';

    } else if (type == 'new') {

      episode = data.episodes[0];
      q = '?type=new&count=' + data.episodes.length + '&startDate=' + data['startDate'];

    }

    if (episode === null) {
      return;
    }

    var showSlug = gva.util.StringUtil.slugify(episode.show_title);

    // Format air date.
    var t = new Date(episode.airdate);
    episode.airdate = gva.util.DateUtil.formatDate(t, 'M j, Y');

    q += '&thumb=' + encodeURIComponent(episode.image_url) +
          '&title=' + encodeURIComponent(episode.title) +
          '&airdate=' + encodeURIComponent(episode.airdate) +
          '&slug=' + encodeURIComponent(episode.slug) +
          '&showSlug=' + encodeURIComponent(showSlug) +
          '&showTitle=' + encodeURIComponent(episode.show_title) +
          '&baseURL=' + encodeURIComponent(gva.config['base_url']);

    this.notification = window.webkitNotifications.createHTMLNotification('/notification.html' + q);
    this.notification.show();
    this.closeTimer = setTimeout(goog.bind(this.hideNotification, this), this.DURATION);

  } else {
    this.requestPermission(goog.bind(this.showNotification, this));
  }
};

/**
 * Hides the current notification.
 */
gva.util.Notify.prototype.hideNotification = function() {
  if (this.notification !== null) {
    this.notification.cancel();
    this.notification = null;
  }
};
