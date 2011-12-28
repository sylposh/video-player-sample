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
goog.provide('gva.component.ShowDetails');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');

goog.require('gva.model.UserModel');
goog.require('gva.vo.Show');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.ShowDetails = function() {

    this.currentHeight = 0;

    this._$tabs = null;
    this._$sections = null;
    this._$subscribe = null;
    this._$about = null;
    this._showData = null;
    this._callbacks = null;

    // Call super constructor
    gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.ShowDetails, gva.component.BaseComponent);

/**
 * Enumeration for this component's event types
 */
gva.component.ShowDetails.EventType = {
        RESIZE: 'ShowDetails::resize'
};

/**
 * @inheritDoc
 */
gva.component.ShowDetails.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    // Query the DOM for the items we need
    this._$tabs = goog.dom.query('nav a[class~="tab"]', $context);
    this._$sections = goog.dom.query('section', $context);
    this._$subscribe = goog.dom.query('nav a.subscribe', $context)[0];
    this._$about = goog.dom.query('section.about article', $context)[0];

    // Create scoped callbacks for event handlers
    var callbacks = this._callbacks = {
            onSubscribeClicked: goog.bind(this.onSubscribeClicked, this),
            onTabClicked: goog.bind(this.onTabClicked, this)
    };

    // Bind subscribe click handler
    goog.events.listen(this._$subscribe, goog.events.EventType.CLICK, callbacks.onSubscribeClicked, false);

    // Bind tab click handlers
    goog.array.forEach(this._$tabs, function($item) {
        goog.events.listen($item, goog.events.EventType.CLICK, callbacks.onTabClicked, false);
    });
};

/**
 * Refreshes the view using the currently active show data
 */
gva.component.ShowDetails.prototype.refresh = function() {

    // If a show has been set, update the view
    if (this._showData) {
        if (this._showData.subscribed) {
            goog.dom.classes.add(this._$subscribe, 'subscribed');
            goog.dom.setTextContent(this._$subscribe, 'Remove');
        } else {
            goog.dom.classes.remove(this._$subscribe, 'subscribed');
            goog.dom.setTextContent(this._$subscribe, 'Subscribe');
        }
    }
};

/**
 * Populates the component from a show data object
 * @param {gva.vo.Show} show The show object to populate the component from.
 */
gva.component.ShowDetails.prototype.setShow = function(show) {

    // Keep a reference to the current show data object
    this._showData = show;

    var showMarkup = '' +
        '<img src="' + show.image_url + '"/>' +
        '<div class="description">' + show.description + '</div>';

    var $content = goog.dom.htmlToDocumentFragment(showMarkup);

    goog.dom.setTextContent(this._$about, '');
    goog.dom.appendChild(this._$about, $content);

    // Call refresh in order to update the view for the current show obeject
    this.refresh();
};


/**
 * Event handler for when the subscribe button is clicked.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowDetails.prototype.onSubscribeClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var subscribed = goog.dom.classes.has($item, 'subscribed');

    // Add or remove the subscription based on the current state
    if (subscribed) {
        gva.model.UserModel.getInstance().removeUserSubscription(this._showData.id);
    } else {
        gva.model.UserModel.getInstance().addUserSubscription(this._showData.id);
    }
};


/**
 * Event handler for when either of the drop down tabs are clicked.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.ShowDetails.prototype.onTabClicked = function(event) {

    event.preventDefault();

    var $tab = event.currentTarget;
    var href = $tab.getAttribute('href');
    var sectionClass = href.replace(/^#/, '');

    // Show / hide tabs.
    goog.array.forEach(this._$tabs, function($item) {

        var item_href = $item.getAttribute('href');

        if ($item === $tab) {
            goog.dom.classes.toggle($item, 'active');
        } else {
            goog.dom.classes.remove($item, 'active');
        }
    });

    // Expand / contract sections
    goog.array.forEach(this._$sections, function($item) {
        if (goog.dom.classes.has($item, sectionClass)) {
            // Tag the item as expanded
            goog.dom.classes.toggle($item, 'expanded');

        } else {
            // Mark container contracted and close it
            goog.dom.classes.remove($item, 'expanded');
        }
        goog.style.setStyle($item, 'height', '0px');
    });

    // Check whether a section has been expanded
    var $expanded = goog.dom.query('section[class~="expanded"]', this.$context)[0];

    // Update the current height
    this.currentHeight = 0;

    // If is has, resize to it's height, otherwise resize back to 0
    if ($expanded) {
        // Compute the content height based on the first child
        var children = goog.dom.getChildren($expanded);
        if (!!children.length) {
            var $content = children[0];
            var bounds = goog.style.getBounds($content);
            this.currentHeight = bounds.height;
            goog.style.setStyle($expanded, 'height', this.currentHeight + 'px');
        }
    }

    // Dispatch the resize event
    this.dispatchEvent(gva.component.ShowDetails.EventType.RESIZE);
};

/**
 * Export the fully qualified class name of this component for dependency
 * injection
 */
goog.exportSymbol('gva.component.ShowDetails', gva.component.ShowDetails);
