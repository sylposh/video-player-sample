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
goog.provide('gva.component.SectionMenu');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('gva.component.BaseComponent');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.SectionMenu = function() {

    /**
     * An array of all section links in the menu
     * @type {Array.<Element>}
     */
    this.$menuItems = null;

    // Call super constructor.
    gva.component.BaseComponent.call(this);
};

/**
 * Extend gva.component.BaseComponent.
 */
goog.inherits(gva.component.SectionMenu, gva.component.BaseComponent);

/**
 * @inheritDoc
 */
gva.component.SectionMenu.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    // Get all menu items inside the context.
    this.$menuItems = goog.dom.getElementsByTagNameAndClass('a', null, $context);

    // Proxy for click handler.
    var clickHandler = goog.bind(this.onMenuItemClicked, this);

    // Bind click handlers to navigation items.
    goog.array.forEach(this.$menuItems, function(element, index) {
        goog.events.listen(element, goog.events.EventType.CLICK, clickHandler, false);
    });
};

/**
 * Highlights the link for the current section based on it's href.
 * @param {string} href The target of the link to highlight.
 */
gva.component.SectionMenu.prototype.setActive = function(href) {

    // If there's no slug, use default
    if (href === '') {
        var matches = goog.dom.getElementsByClass('default');
        if (matches.length > 0) {
            goog.dom.classes.add(matches[0], 'active');
        }
    } else {
        // Build an expression for the target to test each link against.
        var section = new RegExp('^\/?' + href + '\/?$');
        // Loop through all menu items and check their target against the goal.
        goog.array.forEach(this.$menuItems, function(element, index) {
            // If the targets match, tag the link as active.
            if (section.test(element.getAttribute('href'))) {
                goog.dom.classes.add(element, 'active');
            } else {
                goog.dom.classes.remove(element, 'active');
            }
        });
    }
};

/**
 * Event handler for clicked menu items.
 * @param {goog.events.BrowserEvent} event A click event from a menu item.
 */
gva.component.SectionMenu.prototype.onMenuItemClicked = function(event) {

    // Prevent default anchor behavior.
    event.stopPropagation();
    event.preventDefault();

    // Get the link and title from the anchor.
    var link = event.currentTarget;
    var href = link.getAttribute('href');
    var title = link.getAttribute('title');

    // Navigate via ApplicationController.
    gva.controller.ApplicationController.navigate(href, title);
};


/**
 * Export the fully qualified class name of this component for dependency
 * injection.
 */
goog.exportSymbol('gva.component.SectionMenu', gva.component.SectionMenu);
