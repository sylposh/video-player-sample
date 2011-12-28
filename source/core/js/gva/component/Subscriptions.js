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
goog.provide('gva.component.Subscriptions');

/**
 * Import dependencies
 */
goog.require('gva.component.BaseComponent');
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');


/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.Subscriptions = function() {

  // Toggled on menu clicks and used to determine when grid resizing should be enabled.
  this.resizingEnabled = false;

  /**
   * A list of grid items DOM elements
   * @type {Array.<Element>}
   */
  this.$shows = [];

  // The index of the show that's in the subscription flow spotlight.
  this.currentIndex = 0;

  // Cache component elements.
  this.$grid = null;
  this.$gridWrap = null;
  this.$menu = null;
  this.$count = null;

  this.$nextBtn = null;
  this.$prevBtn = null;

  this.$actionIndicator = null;
  this.$actionStatus = null;

  /**
   * Monitors the viewport size so that the grid can flex.
   * @type {goog.dom.ViewportSizeMonitor}
   */
  this.viewportMonitor = new goog.dom.ViewportSizeMonitor();

  // The width of the grid area.
  this.gridMaxWidth = 1;

  // Position of spotlight item.
  this.spotlightX = 1;

  // Width of spotlight item.
  this.SPOTLIGHT_WIDTH = 414;

  // Cell bounds for shows stacked left and right of the spotlight.
  this.CELL_WIDTH = 137;
  this.CELL_SPACING = 40;


  // The closest from the left and right sides of the window that the grid can be.
  this.MIN_GRID_MARGIN = 125;


  this.userModel = null;
  this.dataModel = null;

  this.showsLoaded = false;
  this.episodesLoaded = false;

  // Call super constructor
  gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.Subscriptions, gva.component.BaseComponent);

/**
 * @inheritDoc
 */
gva.component.Subscriptions.prototype.initialize = function($context) {
  this.constructor.superClass_.initialize.call(this, $context);

  // Retrieve the model singletons
  this.userModel = gva.model.UserModel.getInstance();
  this.dataModel = gva.model.DataModel.getInstance();

  this.$grid = goog.dom.getElementByClass('grid', $context);
  this.$gridWrap = goog.dom.getElementByClass('grid-wrap', $context);
  this.$menu = goog.dom.getElementByClass('menu', $context);
  this.$count = goog.dom.getElementByClass('count', $context);

  this.$nextBtn = goog.dom.getElementByClass('next', $context);
  this.$prevBtn = goog.dom.getElementByClass('prev', $context);

  this.$actionIndicator = goog.dom.getElementByClass('action-indicator', $context);
  this.$actionStatus = goog.dom.getElementByClass('status', this.$actionIndicator);

  this.addListeners();
};

/**
 * Binds event listeners
 */
gva.component.Subscriptions.prototype.addListeners = function() {

  // Listen for clicks to subscriptions menu.
  goog.events.listen(this.$menu, goog.events.EventType.CLICK, this.toggleGrid, false, this);

  // Listen for clicks on pagination links.
  goog.events.listen(this.$prevBtn, goog.events.EventType.CLICK, this.onNavClick, false, this);
  goog.events.listen(this.$nextBtn, goog.events.EventType.CLICK, this.onNavClick, false, this);
};

/**
 * Toggles the subscription grid.
 */
gva.component.Subscriptions.prototype.toggleGrid = function() {

  // Show subscription grid.
  goog.dom.classes.toggle(this.$context, 'active');

  // Toggle grid resizing.
  this.resizingEnabled = !this.resizingEnabled;


  // Set resizing events for grid

  if (this.resizingEnabled) {

    // Listen for window resize in order to update the grid.
    goog.events.listen(this.viewportMonitor, goog.events.EventType.RESIZE, this.resize, false, this);

    // Initial resize.
    this.resize(false);

  } else {

    // Stop resizing grid while hidden.
    goog.events.unlisten(this.viewportMonitor, goog.events.EventType.RESIZE, this.resize, false, this);

  }
};

/**
 * Event handler for when an pagination link is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Subscriptions.prototype.onNavClick = function(event) {
  if (event.currentTarget === this.$prevBtn) {
      this.prevShow();
  } else {
      this.nextShow();
  }
  event.preventDefault();
};

/**
 * Navigates to the previous show item
 */
gva.component.Subscriptions.prototype.prevShow = function() {

  if (this.currentIndex > 0) {

   // Update index and refresh the grid.

   this.currentIndex--;
   this.refresh();
  }
};

/**
 * Navigates to the next show item
 */
gva.component.Subscriptions.prototype.nextShow = function() {

  if ((this.currentIndex + 1) < this.$shows.length) {

   // Update index and refresh the grid.

   this.currentIndex++;
   this.refresh();
  }
};

/**
 * Creates a DOM element for an item and appends it to the grid
 * @param {gva.vo.Show} item The data for the item to add.
 */
gva.component.Subscriptions.prototype.addItem = function(item) {

  // Format the date
  var date = new Date(item.latestvideodate);
  var dateStr = gva.util.DateUtil.formatDate(date, 'M j, Y');

  var unwatchedCount = this.dataModel.getEpisodesByShow(item.id, true).length;

  // Create markup for the grid item
  var itemMarkup = '' +
    '<article id="' + item.id + '">' +
      '<figure>' +
        '<img src="' + item.image_url + '"/>' +
      '</figure>' +
      '<div class="spotlight-details">' +
        '<header>' +
          '<h3>' + item.title + '</h3>' +
        '</header>' +
        '<p>' + item.description + '</p>' +
        '<p><span class="unwatched-count">' + unwatchedCount + '</span> unwatched episodes; Updated: ' + dateStr + '</p>' +
        '<nav>' +
          '<a class="remove" href="#"><div>Unsubscribe</div></a>' +
          '<a class="details" href="#"><div>Details</div></a>' +
        '</nav>' +
      '</div>' +
    '</article>';

  var $item = null;

  if (goog.userAgent.IE && goog.userAgent.VERSION < 9) {
    // Create show element for older browsers.
    $item = innerShiv(itemMarkup, false)[0];
  }
  else {
    // Create a DOM element from the markup fragment
    $item = goog.dom.htmlToDocumentFragment(itemMarkup);
  }

  // Initialize buttons
  var $removeBtn = goog.dom.query('a.remove', $item)[0];
  var $detailsBtn = goog.dom.query('a.details', $item)[0];

  // Configure button attributes
  goog.dom.setProperties($detailsBtn, {
    title: item.title,
    href: '/shows/' + item.slug + '/'
  });

  // Bind event handlers to the spotlight options.
  goog.events.listen($removeBtn, goog.events.EventType.CLICK, this.onRemoveClicked, false, this);
  goog.events.listen($detailsBtn, goog.events.EventType.CLICK, this.onDetailsClicked, false, this);

  // Listen for direct navigation clicks to the items.
  goog.events.listen($item, goog.events.EventType.CLICK, this.onItemClicked, false, this);

  // Append the item to the grid
  goog.dom.appendChild(this.$grid, $item);

  // Store a reference
  this.$shows.push($item);

  // Refresh the grid to accommodate the new item
  this.refresh();
};

/**
 * Updates grid boundaries and refreshes the grid if necessary.
 * @param {goog.events.Event=} event The event that triggered the resize.
 */
gva.component.Subscriptions.prototype.resize = function(event) {

  // Get the current width of the grid wrap area.
  var bounds = goog.style.getBounds(this.$gridWrap);
  this.gridMaxWidth = bounds.width - 2 * this.MIN_GRID_MARGIN;

  // Refresh the grid.
  this.refresh();
};

/**
 * Refreshes the grid updating visible items.
 */
gva.component.Subscriptions.prototype.refresh = function() {

  // Refresh display count.
  this.refreshCount();

  // Don't proceed if subscription list is empty.
  if (this.$shows.length < 1) {
    return;
  }

  // Refresh spotlighted item.
  var $spotlight = goog.dom.getElementByClass('spotlight', this.$grid);
  if ($spotlight) {
   goog.dom.classes.remove($spotlight, 'spotlight');
  }

  // Make sure spotlight is visible and refreshed to the most recent currentIndex.
  goog.dom.classes.add(this.$shows[this.currentIndex], 'spotlight');
  goog.style.showElement(this.$shows[this.currentIndex], true);

  // Calculate how many shows can fit left of the spotlight.
  var leftMax = Math.floor((this.gridMaxWidth - this.SPOTLIGHT_WIDTH) / this.CELL_SPACING);

  // The index of the leftmost show to be displayed.
  var showMin = Math.max(0, (this.currentIndex - leftMax));

  var spaceRemaining = this.gridMaxWidth - this.SPOTLIGHT_WIDTH - this.CELL_SPACING * (this.currentIndex - showMin);

  // Initialize index of rightmost show to be displayed.
  var showMax = this.currentIndex;


  // See if there's enough space for the full width show right of the spotlight.
  if (spaceRemaining > (this.CELL_WIDTH + this.CELL_SPACING)) {

    showMax++;
    spaceRemaining -= (this.CELL_WIDTH + this.CELL_SPACING);

    // See how many stacked shows can then fit to the right of that one.
    var rightMax = Math.floor(spaceRemaining / this.CELL_SPACING);

    // finalize index of rightmost show to display.
    showMax = Math.min(this.$shows.length, (rightMax + showMax));

  }

  // We'll set positions left to right and keep track of the next position with this variable.
  var nextPosition = 0;

  // Loop through shows either hiding them or positioning them.
  for (var i = 0, n = this.$shows.length; i < n; i++) {

    var $show = this.$shows[i];

    // Hide out of bounds shows.
    if ((i < showMin) || (i > showMax)) {
      goog.style.showElement($show, false);
      continue;
    }

    // Set position and visibility of show.
    $show.style.left = nextPosition + 'px';
    goog.style.showElement($show, true);

    // Determine next show's position.
    nextPosition += this.CELL_SPACING;

    // Add extra for spotlight positioning.
    nextPosition += (this.currentIndex == i) ? this.SPOTLIGHT_WIDTH : 0;

  }

  // Center grid.
  var spaceRemaining = this.gridMaxWidth - (nextPosition - this.CELL_SPACING + this.CELL_WIDTH);

  var gridPosition = this.MIN_GRID_MARGIN;
  gridPosition += (spaceRemaining > 0) ? (spaceRemaining / 2) : 0;

  this.$grid.style.left = gridPosition + 'px';
};

/**
 * Event handler for when an item's remove button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Subscriptions.prototype.onRemoveClicked = function(event) {
  // Remove subscription from the user model.
  var show = goog.dom.getAncestorByTagNameAndClass(event.currentTarget, 'article');
  this.userModel.removeUserSubscription(show['id']);
};

/**
 * Removes a show from the list.
 * @param {number} id The show id to remove.
 */
gva.component.Subscriptions.prototype.removeItem = function(id) {

  var show = goog.dom.getElement(id);

  goog.dom.removeNode(show);

  goog.array.remove(this.$shows, show);

  // Make sure currentIndex is valid
  if (this.currentIndex > this.$shows.length - 1) {
    this.currentIndex = Math.max(0, this.$shows.length - 1);
  }

  this.refresh();
};

/**
 * Event handler for when a show's details button is clicked.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Subscriptions.prototype.onDetailsClicked = function(event) {

  event.preventDefault();

  // Get the show page info and go there.
  var $item = event.currentTarget;
  var title = $item.getAttribute('title');
  var slug = $item.getAttribute('href');

  gva.controller.ApplicationController.navigate(slug, title);

  // Close the subscription grid.
  this.toggleGrid();
};

/**
 * Event handler for when an item is clicked that brings to the spotlight.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Subscriptions.prototype.onItemClicked = function(event) {

  // Ignore if target is already in the spotlight.
  if (goog.dom.classes.has(event.currentTarget, 'spotlight')) {
    return;
  }
  else {

    // Get index from clicked element.
    var index = goog.array.indexOf(this.$shows, event.currentTarget);

    // Update current index and refresh to move show to spotlight
    this.currentIndex = index;
    this.refresh();
  }
};

/**
 * Refreshes the subscription count based on the number of items stored.
 */
gva.component.Subscriptions.prototype.refreshCount = function() {
  this.$count.innerHTML = this.$shows.length;
};

/**
 * Refreshes the unwatched show count displayed for the given show.
 * @param {number} showID The show/element id that needs an updated count.
 */
gva.component.Subscriptions.prototype.updateUnwatchedCount = function(showID) {

  // Get updated count.
  var unwatchedCount = this.dataModel.getEpisodesByShow(showID, true).length;

  // Get unwatched count element to update.
  var $show = goog.dom.getElement(showID);
  var $unwatchedCount = goog.dom.getElementByClass('unwatched-count', $show);

  $unwatchedCount.innerHTML = unwatchedCount;
};

/**
 * Export the fully qualified class name of this component for dependency injection
 */
goog.exportSymbol('gva.component.Subscriptions', gva.component.Subscriptions);
