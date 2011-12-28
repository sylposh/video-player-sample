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
goog.provide('gva.component.FlexibleGrid');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('gva.easing');
goog.require('gva.util.Grid');


/**
 * Creates a new FlexibleGrid instance.
 * @constructor
 */
gva.component.FlexibleGrid = function() {

    this.$context = null;

    /**
     * The grid boundaries.
     * @type {goog.math.Rect}
     */
    this._bounds = null;

    this._currentIndex = 0;
    this._currentPage = 0;
    this._totalPages = 1;

    /**
     * A list of grid items DOM elements
     * @type {Array.<Element>}
     */
    this._$items = [];

    this._$prevBtn = null;
    this._$nextBtn = null;

    /**
     * Monitors the viewport size so that the grid can flex.
     * @type {goog.dom.ViewportSizeMonitor}
     */
    this._viewportMonitor = new goog.dom.ViewportSizeMonitor();

    /**
     * Enumeration for event types dispatched from this class
     */
    gva.component.FlexibleGrid.EventType = {
            /**
             * Dispatched whenever grid is refreshed.
             */
            REFRESHED: 'FlexibleGrid::refreshed'
    };

    // Call super constructor.
    gva.util.Grid.call(this);
};

/**
 * Extend gva.util.Grid
 */
goog.inherits(gva.component.FlexibleGrid, gva.util.Grid);


/**
 * Initializes a new grid.
 * @param {Element} $context The context element the grid is placed in.
 * @param {number} cellWidth The width of each cell.
 * @param {number} cellHeight The height of each cell.
 * @param {number} cellSpacingX The horizontal space between each column.
 * @param {number} cellSpacingY The vertical space between each row.
 */
gva.component.FlexibleGrid.prototype.initialize = function($context, cellWidth, cellHeight, cellSpacingX, cellSpacingY) {

    this.$context = $context;

    // Build the pagination menu
    this.createNavigation();

    // Bind event handlers
    this.addListeners();

    // Set up the fixed grid cell size.
    this.constructor.superClass_.setCellBounds.call(this, cellWidth, cellHeight, cellSpacingX, cellSpacingY);

    // Resize to initial boundaries.
    this.resize();
};

/**
 * Creates the pagination navigation and appends it to the context
 */
gva.component.FlexibleGrid.prototype.createNavigation = function() {

    // Create a navigation node
    var $nav = goog.dom.createDom('nav');
    goog.dom.classes.add($nav, 'pagination');

    // Create next and previous buttons
    this._$prevBtn = goog.dom.createDom('a', {'href': '#'}, 'Previous Page');
    this._$nextBtn = goog.dom.createDom('a', {'href': '#'}, 'Next Page');

    goog.dom.classes.add(this._$prevBtn, 'prev');
    goog.dom.classes.add(this._$nextBtn, 'next');

    // Add icons to them
    goog.dom.appendChild(this._$prevBtn, goog.dom.createDom('span', {'class': 'icon'}));
    goog.dom.appendChild(this._$nextBtn, goog.dom.createDom('span', {'class': 'icon'}));

    // Add buttons to nav
    goog.dom.appendChild($nav, this._$prevBtn);
    goog.dom.appendChild($nav, this._$nextBtn);

    // Add all to the DOM
    goog.dom.appendChild(this.$context, $nav);
};

/**
 * Binds event listeners to viewport resize and pagination mouse events
 */
gva.component.FlexibleGrid.prototype.addListeners = function() {

    // Listen for window resize in order to update the grid.
    goog.events.listen(this._viewportMonitor, goog.events.EventType.RESIZE, goog.bind(this.resize, this));

    // Listen for clicks on pagination links
    goog.events.listen(this._$prevBtn, goog.events.EventType.CLICK, goog.bind(this.onNavClick, this));
    goog.events.listen(this._$nextBtn, goog.events.EventType.CLICK, goog.bind(this.onNavClick, this));
};

/**
 * Adds a DOM element to the grid
 * @param {Element} $item The DOM element to add to the grid.
 */
gva.component.FlexibleGrid.prototype.addItem = function($item) {
    // Append the item to the grid
    goog.dom.appendChild(this.$context, $item);

    // Store a reference
    this._$items.push($item);

    // Refresh the grid to accommodate the new item
    this.refresh(false);
};

/**
 * Returns a list of all items controlled by the grid, including those that
 * might not be visible in the current page
 * @return {Array.<Element>} All items (visible and hidden) in this grid.
 */
gva.component.FlexibleGrid.prototype.getItems = function() {
    return this._$items;
};

/**
 * Removes all items from the grid and reset the current page and offset
 */
gva.component.FlexibleGrid.prototype.clear = function() {

    // Remove any current items
    goog.array.forEach(this._$items, function($item) {
        goog.dom.removeNode($item);
    });

    // Go back to the first page
    this._currentIndex = 0;
    this._currentPage = 0;

    // Clear the items array
    this._$items = [];
};

/**
 * Navigates to the previous grid page
 */
gva.component.FlexibleGrid.prototype.prevPage = function() {
    if (this._currentIndex > 0) {
        this._currentIndex -= this.cells;
        if (this._currentIndex < 0) {
          this._currentIndex = 0;
        }
        this.refresh(true, 'ltr');
    }
};

/**
 * Navigates to the next grid page
 */
gva.component.FlexibleGrid.prototype.nextPage = function() {
    if (this._currentIndex < this._$items.length - this.cells) {
        this._currentIndex += this.cells;
        this.refresh(true, 'rtl');
    }
};

/**
 * Refreshes the grid view and updates visible items, with an optional transition effect
 * @param {boolean} transition Whether to use a transition when switching items.
 * @param {string} direction The horizontal transition direction 'ltr' or 'rtl'.
 */
gva.component.FlexibleGrid.prototype.refresh = function(transition, direction) {

    transition = !!transition;

    // Refresh the super grid
    this.constructor.superClass_.refresh.call(this);

    // Compute the number of pages
    this._totalPages = Math.ceil(this._$items.length / this.cells);

    // Calculate which items will be on screen
    var min = this._currentIndex;
    var max = min + this.cells;

    var windowWidth = this._viewportMonitor.getSize().width;

    // Reposition elements.
    var $item, coord;

    for (var i = 0, j = 0, n = this._$items.length; i < n; i++) {

        $item = this._$items[i];

        if (i >= min && i < max) {

            coord = this.coords[j++];

            // Show and position the element if it should appear in the grid

            if (transition) {

              // Position one screen left or right of final position and then slide to final position.
              var start = (direction == 'ltr') ? [coord.x - windowWidth, coord.y] : [coord.x + windowWidth, coord.y];
              var end = [coord.x, coord.y];

              var slide = new goog.fx.dom.Slide($item, start, end, 250, goog.fx.easing.easeOut);

              // Show element at the beginning of slide.
              goog.events.listen(slide, goog.fx.Animation.EventType.BEGIN,
                function(event) {
                  goog.style.showElement(event.currentTarget.element, true);
              });

              slide.play();
            }

            else {
              goog.style.showElement($item, true);
              goog.style.setPosition($item, coord.x, coord.y);
            }

        } else {

            // Hide the element if it doesn't appear in the grid

            if (transition && goog.style.isElementShown($item)) {

              // Slide from current position one screen left or right.
              coord = goog.style.getPosition($item);
              var start = [coord.x, coord.y];
              var end = (direction == 'ltr') ? [coord.x + windowWidth, coord.y] : [coord.x - windowWidth, coord.y];

              var slide = new goog.fx.dom.Slide($item, start, end, 250, goog.fx.easing.easeOut);

              // Hide element once off screen at the end of slide.
              goog.events.listen(slide, goog.fx.Animation.EventType.END,
                function(event) {
                  goog.style.showElement(event.currentTarget.element, false);
              });

              slide.play();
            }

            else {
              goog.style.showElement($item, false);
            }
        }
    }

    // Disable previous button if necessary
    if (min < 1) {
        goog.dom.classes.add(this._$prevBtn, 'disabled');
    } else {
        goog.dom.classes.remove(this._$prevBtn, 'disabled');
    }

    // Disable next button if necessary
    if (max > this._$items.length) {
        goog.dom.classes.add(this._$nextBtn, 'disabled');
    } else {
        goog.dom.classes.remove(this._$nextBtn, 'disabled');
    }


    // Dispatch refresh event for listeners.
    var event = new goog.events.Event(gva.component.FlexibleGrid.EventType.REFRESHED);
    // event.data = this._$items[this._currentIndex];
    this.dispatchEvent(event);
};

/**
 * Updates grid boundaries and refreshes the grid if necessary.
 * @param {goog.events.Event=} event The event that triggered the resize.
 */
gva.component.FlexibleGrid.prototype.resize = function(event) {

    // Get the current bounds of the DOM context.
    this._bounds = goog.style.getBounds(this.$context);

    // Update grid boundaries to force recalculation.
    this.constructor.superClass_.setGridBounds.call(this, 0, 0, this._bounds.width, this._bounds.height);

    // Refresh the grid
    this.refresh(false);
};

/**
 * Event handler for when an pagination link is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.FlexibleGrid.prototype.onNavClick = function(event) {
    if (event.currentTarget === this._$prevBtn) {
        this.prevPage();
    } else {
        this.nextPage();
    }
    event.preventDefault();
};
