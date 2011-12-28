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
goog.provide('gva.controller.HeaderController');

/**
 * Import dependencies
 */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('gva.controller.AbstractController');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.HeaderController = function() {

    // Call super constructor
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController
 */
goog.inherits(gva.controller.HeaderController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.HeaderController.prototype.initialize = function($context) {
    this.constructor.superClass_.initialize.call(this, $context);

    // Trigger the Chrome store popup if browsing without install.
    this.enablePopup();

    this.setupSharing();
};


/**
 * @inheritDoc
 */
gva.controller.HeaderController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.HeaderController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
};


/**
 * Sets up sharing links for home page & show details pages.
 */
gva.controller.HeaderController.prototype.setupSharing = function() {

  // Listen for sharing clicks from show details page.
  var $sharing = goog.dom.query('.share article a');

  for (var i = 0, n = $sharing.length; i < n; i++) {
      goog.events.listen($sharing[i], goog.events.EventType.CLICK, this.onShareClick, false, this);
  }

  // Setup home page sharing.
  var $homeSharing = goog.dom.query('#home .sharing')[0];
  var $homeShareMenu = goog.dom.getElementByClass('menu', $homeSharing);
  var $homeShareLinks = goog.dom.getElementsByTagNameAndClass('a', null, $homeSharing);

  // Listen for menu button clicks.
  goog.events.listen($homeShareMenu, goog.events.EventType.CLICK, goog.bind(function(event) {
    goog.dom.classes.toggle(event.currentTarget.parentNode, 'active');
  }, this), false);

  // Listen for sharing link clicks.
  for (var i = 0, n = $homeShareLinks.length; i < n; i++) {
      goog.events.listen($homeShareLinks[i], goog.events.EventType.CLICK, this.onShareClick, false, this);
  }
};


/**
 * Handles clicks to share buttons on various pages.
 * @param {goog.events.BrowserEvent} event The event which triggered the handler.
*/
gva.controller.HeaderController.prototype.onShareClick = function(event) {

    event.preventDefault();

    var type = goog.dom.classes.get(event.currentTarget)[0];
    var location = encodeURIComponent(window.location);
    var title = encodeURIComponent(document.title);

    if (type == 'twitter') {
        window.open('http://twitter.com/share?url=' + location + '&text=' + title + '');
    } else if (type == 'facebook') {
        window.open('http://www.facebook.com/sharer.php?u=' + location + '&t=' + title, 'sharer', 'toolbar=0,status=0,width=626,height=436');
    }
};


/**
 * Displays Chrome store popup if browsing without install.
 */
gva.controller.HeaderController.prototype.enablePopup = function() {

    var shouldShowPopup = true;

    // Determine if app is installed.    
    if (window.chrome) {
      if (window.chrome.app.isInstalled === true) {
        shouldShowPopup = false;
      }
    }
    
    if (shouldShowPopup) {
      // Grab the buttons and elements we're going to need
      var $popup = goog.dom.getElementByClass('chrome-store-popup');
      var $detailBtn = goog.dom.query('#cws-detail-page')[0];
      var $installBtn = goog.dom.query('#do-inline-install')[0];
      var $closeBtn = goog.dom.getElementsByTagNameAndClass('div', null, $popup)[0];

      // Make the pop-up visible
      goog.style.setStyle($popup, 'display', 'block');

      // Grab the URL to the app from the Chrome Web Store, and set up the link
      // to the details page
      var $cwsLink = goog.dom.getElementsByTagNameAndClass('link[rel=chrome-webstore-item]')[0];
      if ($cwsLink !== undefined) {
        var cwsDetailPage = $cwsLink.getAttribute('href') + '/details/';        
        $detailBtn.setAttribute('href', cwsDetailPage);
        // Listen for inline install button click
        goog.events.listen($installBtn, goog.events.EventType.CLICK, goog.bind(function() {
          window.chrome.webstore.install();
        }, this), false);
      } else {
        log('ERROR: <link rel="chrome-webstore-item" href="full_url_here"> not set in <head> properly.');
        goog.style.setStyle($detailBtn, 'display', 'none');
        goog.style.setStyle($installBtn, 'display', 'none');
      }

      // Listen for close button click.
      goog.events.listen($closeBtn, goog.events.EventType.CLICK, goog.bind(function() {
        goog.style.setStyle($popup, 'display', 'none');
      }, this), false);
      
    }
};


/**
 * Export the fully qualified class name of this controller for dependency injection
 */
goog.exportSymbol('gva.controller.HeaderController', gva.controller.HeaderController);
