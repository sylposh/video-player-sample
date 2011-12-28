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

// Define custom DragDropGroup
goog.provide('gva.ShowDragDropGroup');
/**
 * Provide a namespace for this class
 */
goog.provide('gva.component.ShowGrid');

/**
 * Import dependencies
 */
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.events');
goog.require('goog.fx');
goog.require('goog.fx.AbstractDragDrop');
goog.require('goog.fx.DragDrop');
goog.require('goog.fx.DragDropGroup');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('gva.component.BaseComponent');
goog.require('gva.component.FlexibleGrid');
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');
goog.require('gva.util.DateUtil');
goog.require('gva.vo.Show');



/**
 * Custom DragDropGroup implementation to override drag positioning.
 * @constructor
 * @extends {goog.fx.DragDropGroup}
 */
gva.ShowDragDropGroup = function() {
  goog.fx.DragDropGroup.call(this);
};
goog.inherits(gva.ShowDragDropGroup, goog.fx.DragDropGroup);


/**
* (Overrides goog.fx.DragDropGroup.getDragElementPosition)
* Returns the position for the drag element.
*
* @param {Element} sourceEl Drag source element.
* @param {Element} el The dragged element created by createDragElement().
* @param {goog.events.BrowserEvent} event Mouse down event for start of drag.
* @return {goog.math.Coordinate} The position for the drag element.
*/
gva.ShowDragDropGroup.prototype.getDragElementPosition = function(sourceEl, el, event) {
  return new goog.math.Coordinate(event.clientX - 100, event.clientY - 150);
};

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.ShowGrid = function() {

    /**
     * The flexible grid for arranging items.
     * @type {gva.component.FlexibleGrid}
     */
    this._grid = new gva.component.FlexibleGrid();

    // The model instances.
    this._userModel = null;
    this._dataModel = null;

    // The subscriptions component instance.
    this._subscriptions = null;

    /**
     * The object containing all draggable shows.
     * @type {goog.fx.DragDropGroup}
     */
    this._draggableShows = null;

    /**
     * The drop area for draggable shows.
     * @type {goog.fx.DragDrop}
     */
    this._dropArea = null;

    // Boolean for whether or not a show is being dragged.
    this.dragging = false;

    // Timeouts for changing back to default text and closing the 'show added' text.
    this.confirmationTextTimer = null;
    this.confirmationCloseTimer = null;

    // Timeout for removing the up state of the subscriptions panel
    this.closeSubscriptionsTimer = null;

    // Duration (ms) of show added confirmation.
    this.CONFIRMATION_DURATION = 2000;

    // Default text for the droppable area.
    this.DROP_INSTRUCTIONS = 'Drop Shows here to subscribe';

    // Whether or not a successful drop has occurred recently.
    // Should be set to false by dragend event immediately after drop event.
    this.recentlyDropped = false;

    // Call super constructor
    gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.ShowGrid, gva.component.BaseComponent);

/**
 * @inheritDoc
 */
gva.component.ShowGrid.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    // Get instances.
    this._userModel = gva.model.UserModel.getInstance();
    this._dataModel = gva.model.DataModel.getInstance();

    // Set up the fixed grid cell size.
    this._grid.initialize($context, 200, 380, 30, 30);
};


/**
 * Creates a DOM element for an item and appends it to the grid
 * @param {gva.vo.Show} item The data for the item to add.
 */
gva.component.ShowGrid.prototype.addItem = function(item) {

    // Format the date
    var date = new Date(item.latestvideodate);
    var dateStr = gva.util.DateUtil.formatDate(date, 'M j, Y');

    var subscribeClass = item.subscribed ? 'subscribed' : '';
    var subscribeCopy = item.subscribed ? 'Remove' : 'Subscribe';

    var episodesLink = '/shows/' + item.slug + '/';

    // Create markup for the grid item
    var itemMarkup = '' +
    '<article class="show" data-showid="' + item.id + '">' +
        '<figure>' +
            '<img src="' + item.image_url + '"/>' +
        '</figure>' +
        '<header>' +
            '<h3>' + item.title + '</h3>' +
        '</header>' +
        '<p>' + item.description + '</p>' +
        '<footer>' +
            '<span class="icon"></span><p>' + item.videocount + ' Videos, Updated: ' + dateStr + '</p>' +
        '</footer>' +
        '<nav>' +
            '<a class="subscribe ' + subscribeClass + '" href="#" data-showid="' + item.id + '">' +
                '<strong><span class="icon"></span><em>' + subscribeCopy + '</em></strong>' +
            '</a>' +
            '<a class="episodes" title="' + item.title + '" href="' + episodesLink + '"><strong><span class="icon"></span><em>Episodes</em></strong></a>' +
        '</nav>' +
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

    var $subscribeBtn = goog.dom.query('a.subscribe', $item)[0];
    var $episodesBtn = goog.dom.query('a.episodes', $item)[0];

    // Bind event handlers to the object
    goog.events.listen($subscribeBtn, goog.events.EventType.CLICK, goog.bind(this.onSubscribeClicked, this));
    goog.events.listen($episodesBtn, goog.events.EventType.CLICK, goog.bind(this.onEpisodesClicked, this));

    // Add the item to the grid
    this._grid.addItem($item);
};

/**
 * Refreshes the grid and updates the items based on the latest data
 * @param {Array.<Object>} showData The updated show data.
 */
gva.component.ShowGrid.prototype.refresh = function(showData) {

    var $gridItems = this._grid.getItems();
    var $gridItem;
    var $subscribeBtn;
    var $linkText;
    var showObj;
    var showID;

    for (var i = 0, n = $gridItems.length; i < n; i++) {

        $gridItem = $gridItems[i];

        // Get the show ID from the elements data attribute
        showID = goog.dom.dataset.get($gridItem, 'showid');

        // Find the corresponding show data object
        showObj = goog.array.find(showData, function(show) {
            return show.id === showID;
        });

        // Update the subscribe button based on the new data
        $subscribeBtn = goog.dom.query('a.subscribe', $gridItem)[0];
        $linkText = goog.dom.query('em', $subscribeBtn)[0];

        // Update the text content
        if (showObj && showObj.subscribed) {
            goog.dom.classes.add($subscribeBtn, 'subscribed');
            goog.dom.setTextContent($linkText, 'Remove');
        } else {
            goog.dom.classes.remove($subscribeBtn, 'subscribed');
            goog.dom.setTextContent($linkText, 'Subscribe');
        }
    }
};

/**
 * Event handler for when an item's subscribe button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onSubscribeClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var showID = goog.dom.dataset.get($item, 'showid');
    var subscribed = goog.dom.classes.has($item, 'subscribed');

    // Add or remove the subscription based on the current state
    if (subscribed) {
        this._userModel.removeUserSubscription(showID);
    } else {
        this._userModel.addUserSubscription(showID);
    }
};

/**
 * Event handler for when an item's episode button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onEpisodesClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);
};


/**
 * Initializes the draggable shows and the subscription drop target.
 */
gva.component.ShowGrid.prototype.initDragDrop = function() {

  // Get subscription component instance.
  this._subscriptions = gva.component.ComponentInitializer.getComponentByQuery('#subscriptions');

  // Get show articles.
  var $gridItems = this._grid.getItems();

  // Initialize DragDropGroup
  this._draggableShows = new gva.ShowDragDropGroup();

  // Add draggable items.
  for (var i = 0, n = $gridItems.length; i < n; i++) {

    var $gridItem = $gridItems[i];

    var $draggableItem = goog.dom.getElementsByTagNameAndClass('figure', null, $gridItem)[0];

    // Get data for the draggable to carry.
    var showID = goog.dom.dataset.get($gridItem, 'showid');
    var show = this._dataModel.getShowByID(showID);
    var data = {};
    data['title'] = show.title;
    data['showID'] = showID;

    this._draggableShows.addItem($draggableItem, data);

    // Set hover states for revealing droppable area/instructions.
    goog.events.listen($gridItem, goog.events.EventType.MOUSEOVER, this.onDraggableMouseOver, false, this);
    goog.events.listen($gridItem, goog.events.EventType.MOUSEOUT, this.onDraggableMouseOut, false, this);
  }

  // Init droppable area and set as target for draggables.
  var $dropAreaEl = this._subscriptions.$actionIndicator;
  this._dropArea = new goog.fx.DragDrop($dropAreaEl);

  this._draggableShows.addTarget(this._dropArea);

  // Add DragDrop classes
  this._draggableShows.setSourceClass('source');
  this._draggableShows.setDragClass('dragging');

  // Init to add listeners and start the drag/drop action.
  this._draggableShows.init();

  // Set custom dragdrop listeners.
  goog.events.listen(this._draggableShows, goog.fx.AbstractDragDrop.EventType.DRAGSTART, goog.bind(this.onDragStart, this), false, this);
  goog.events.listen(this._draggableShows, goog.fx.AbstractDragDrop.EventType.DRAGEND, goog.bind(this.onDragEnd, this), false, this);
  goog.events.listen(this._dropArea, goog.fx.AbstractDragDrop.EventType.DROP, goog.bind(this.onDrop, this), false, this);
};

/**
 * Event handler for when a show starts being dragged.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onDragStart = function(event) {
  this.toggleDropArea(true);
  this.dragging = true;
};


/**
 * Event handler for when a show finishes being dragged.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onDragEnd = function(event) {
  this.dragging = false;

  if (!this.recentlyDropped) {
    this.toggleDropArea(false);
  }

  this.recentlyDropped = false;
};


/**
 * Event handler for when a show is dropped onto the target.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onDrop = function(event) {

  var showData = event.dragSourceItem.data;

  // Determine if already subscribed.
  var subscribed = false;
  var subscriptions = this._userModel.getUserSubscriptions();

  if (goog.array.indexOf(subscriptions, showData['showID']) != -1) {
    subscribed = true;
  }

  // Add or remove the subscription based on the current state
  if (!subscribed) {
    this.recentlyDropped = true;
    this._userModel.addUserSubscription(showData['showID']);
    this.showDropConfirmation(showData['title']);
  }
};


/**
 * Slides the subscription button up and down to reveal the droppable area.
 * @param {Boolean} display Set to true to reveal the droppable area and false to close it.
 */
gva.component.ShowGrid.prototype.toggleDropArea = function(display) {

  clearTimeout(this.closeSubscriptionsTimer);

  if (display) {
    goog.dom.classes.add(this._subscriptions.$context, 'up');
  }
  else if (!this.dragging) {
    var self = this;
    this.closeSubscriptionsTimer = setTimeout(function() {
      goog.dom.classes.remove(self._subscriptions.$context, 'up');
    },500);
  }
};

/**
 * Updates the action indicator text/icon to display a confirmation t=emporarily.
 * @param {String} showName The name of the show that has been added.
 */
gva.component.ShowGrid.prototype.showDropConfirmation = function(showName) {

  this.resetTimers();

  goog.dom.classes.add(this._subscriptions.$actionIndicator, 'confirm-addition');
  this._subscriptions.$actionStatus.innerHTML = showName + ' added';

  this.confirmationTextTimer = setTimeout(goog.bind(this.hideDropConfirmation, this), this.CONFIRMATION_DURATION);
  this.confirmationCloseTimer = setTimeout(goog.bind(function() {
    this.toggleDropArea(false);
    this.confirmationCloseTimer = null;
  }, this), this.CONFIRMATION_DURATION - 250);
};


/**
 * Updates the action indicator text/icon to default display.
 */
gva.component.ShowGrid.prototype.hideDropConfirmation = function() {
  goog.dom.classes.remove(this._subscriptions.$actionIndicator, 'confirm-addition');
  this._subscriptions.$actionStatus.innerHTML = this.DROP_INSTRUCTIONS;
};


/**
 * Event handler for mouseover events on draggable shows.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onDraggableMouseOver = function(event) {
  this.toggleDropArea(true);
};


/**
 * Event handler for mouseout events on draggable shows.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowGrid.prototype.onDraggableMouseOut = function(event) {
  if (this.confirmationCloseTimer === null) {
    this.toggleDropArea(false);
  }
};


/**
 * Clears and nulls all drop area confirmation timeouts.
 */
gva.component.ShowGrid.prototype.resetTimers = function() {
  clearTimeout(this.confirmationTextTimer);
  clearTimeout(this.confirmationCloseTimer);
  this.confirmationTextTimer = null;
  this.confirmationCloseTimer = null;
};


/**
 * Export the fully qualified class name of this component for dependency injection.
 */
goog.exportSymbol('gva.component.ShowGrid', gva.component.ShowGrid);
