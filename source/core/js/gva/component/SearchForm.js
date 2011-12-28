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
goog.provide('gva.component.SearchForm');

/**
 * Import dependencies
 */
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.dom.forms');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.style');
goog.require('gva.component.BaseComponent');
goog.require('gva.easing');
goog.require('gva.model.DataModel');


/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.SearchForm = function() {

    this._$searchInput = null;
    this._$searchReset = null;
    this._$selected = null;
    this._$results = null;
    this._$info = null;
    this._placeholder = null;
    this._lastQuery = null;
    this._callbacks = null;

    // The height of each result item.
    this.RESULT_LI_HEIGHT = 101;

    // The height of the num results info and padding.
    this.RESULT_BASE_HEIGHT = 52;

    // The difference between the base height and the base offsetHeight
    this.RESULT_BASE_OFFSET = 13;

    // Additional height from 12px margin added when 1 or more results found.
    this.RESULT_BOTTOM_MARGIN = 12;

    // Additional 40px 'more' link added when more than 6 results are found.
    this.RESULT_MORE_HEIGHT = 40;

    // Width of results drop down.
    this.RESULT_WIDTH = 319;

    this.RESULT_ANIMATION_DURATION = 250;

    // Maximum number of results to display in dropdown results.
    this.MAX_LIVE_RESULTS = 6;

    // Call super constructor
    gva.component.BaseComponent.call(this);
};


/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.SearchForm, gva.component.BaseComponent);


/**
 * @inheritDoc
 */
gva.component.SearchForm.prototype.initialize = function($context) {

    // Call super method.
    this.constructor.superClass_.initialize.call(this, $context);

    this.callbacks = {
            onKeyUp: goog.bind(this.onKeyUp, this),
            onInputChange: goog.bind(this.onInputChange, this),
            onFormSubmit: goog.bind(this.onFormSubmit, this),
            onSearchFocus: goog.bind(this.onSearchFocus, this),
            onSearchBlur: goog.bind(this.onSearchBlur, this),
            onEpisodeClicked: goog.bind(this.onEpisodeClicked, this),
            onResetClicked: goog.bind(this.onResetClicked, this),
            onShowClicked: goog.bind(this.onShowClicked, this),
            handleClick: goog.bind(this.handleClick, this)
    };

    // Grab the search input element
    this._$searchInput = goog.dom.query('input[name="search"]', this.$context)[0];

    // Grab the reset button
    this._$searchReset = goog.dom.query('input[type="reset"]', this.$context)[0];

    // Listen for arrow key events on form
    goog.events.listen(this.$context, goog.events.EventType.KEYUP, this.callbacks.onKeyUp, false);

    // Listen the form events
    goog.events.listen(this._$searchInput, goog.events.EventType.KEYUP, this.callbacks.onInputChange, false);
    goog.events.listen(this.$context, goog.events.EventType.SUBMIT, this.callbacks.onFormSubmit, false);

    // Listen for focus / blur events for setting place holder text
    goog.events.listen(this._$searchInput, goog.events.EventType.FOCUSIN, this.callbacks.onSearchFocus, false);
    goog.events.listen(this._$searchInput, goog.events.EventType.FOCUSOUT, this.callbacks.onSearchBlur, false);

    // Listen for clicks on the reset button
    goog.events.listen(this._$searchReset, goog.events.EventType.CLICK, this.callbacks.onResetClicked, false);

    // Use the initial value of the search input as the place holder
    this._placeholder = goog.dom.forms.getValue(this._$searchInput);

    // Build the results container
    this.initResults();
};


/**
 * Builds the drop down results container.
 */
gva.component.SearchForm.prototype.initResults = function() {

    this._$info = goog.dom.htmlToDocumentFragment('<li class="info">Hello</li>');
    this._$results = goog.dom.htmlToDocumentFragment('<ul class="results"></ul>');

    goog.dom.appendChild(this._$results, this._$info);
    goog.dom.appendChild(this.$context, this._$results);

    goog.style.showElement(this._$results, false);
};


/**
 * Creates a DOM element for an episode result list item.
 * @param {gva.vo.Episode} episode The data for the result item.
 * @return {Element} The element for the episode's entry in the results list.
 */
gva.component.SearchForm.prototype.makeResult = function(episode) {

    var showSlug = gva.util.StringUtil.slugify(episode.show_title);
    var episodeSlug = gva.util.StringUtil.slugify(episode.title);
    var episodeText = gva.util.StringUtil.stripTags(episode.text);
    episodeText = gva.util.StringUtil.singleSentence(episodeText, 15, 60);

    var markup = '' +
        '<li>' +
            '<div>' +
            '<a class="episode" href="/home/' + episode.slug + '" title="' + episode.title + '" data-episodeid="' + episode.id + '">' +
                '<img src="' + episode.image_url + '"/>' +
                '<strong>' + episode.title + '</strong>' +
                '<em>' + episodeText + '</em>' +
             '</a>' +
             '<a class="show" href="/shows/' + showSlug + '/" title="' + episode.show_title + '">' + episode.show_title + '</a>' +
             '</div>' +
        '</li>';

    return goog.dom.htmlToDocumentFragment(markup);
};


/**
 * Empties episode results from drop down.
 */
gva.component.SearchForm.prototype.clearResults = function() {

    var $children = goog.dom.getChildren(this._$results);
    var callbacks = this.callbacks;

    // Remove children and event handlers
    goog.array.forEach($children, function($element) {

        $episodeLink = goog.dom.query('a.episode', $element)[0];
        $showLink = goog.dom.query('a.show', $element)[0];

        if (typeof($episodeLink) !== 'undefined') {
            goog.events.unlisten($episodeLink, goog.events.EventType.CLICK, callbacks.onEpisodeClicked);
            goog.events.unlisten($showLink, goog.events.EventType.CLICK, callbacks.onShowClicked);
        }
    });

    goog.dom.removeChildren(this._$results);
};


/**
 * Event handler for when the search input is focused.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onSearchFocus = function(event) {

    var value = goog.dom.forms.getValue(this._$searchInput);

    if (value === this._placeholder) {
        goog.dom.forms.setValue(this._$searchInput, '');
        goog.dom.classes.remove(this._$searchInput, 'placeholder');
    }
};


/**
 * Event handler for when the search input is blurred.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onSearchBlur = function(event) {

    var value = goog.dom.forms.getValue(this._$searchInput);

    if (value.replace(/\s+/g, '').length === 0) {
        goog.dom.forms.setValue(this._$searchInput, 'Search');
        goog.dom.classes.add(this._$searchInput, 'placeholder');
    }
};


/**
 * Event handler for keyUp events while typing in the search input.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onKeyUp = function(event) {

    event.preventDefault();

    switch (event.keyCode) {

        case goog.events.KeyCodes.UP:

            // If no results are selected, focus the first result
            if (this._$selected) {

                // Down go up further than the first result
                if (this._$selected.previousSibling === this._$info) {
                    return;
                }

                // Select the previous result
                if (this._$selected.previousSibling) {
                    this._$selected = this._$selected.previousSibling;
                }
            }

            // Focus the first link inside the result
            goog.dom.query('a', this._$selected)[0].focus();

            break;

        case goog.events.KeyCodes.DOWN:

            // If no results are selected, focus the first result
            if (!this._$selected) {
                this._$selected = goog.dom.getChildren(this._$results)[1];
            } else {

                // Select the next result
                if (this._$selected.nextSibling) {
                    this._$selected = this._$selected.nextSibling;
                }
            }

            // Focus the first link inside the result
            goog.dom.query('a', this._$selected)[0].focus();

            break;
    }
};


/**
 * Event handler for when the search input value changes.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onInputChange = function(event) {

    var query = goog.dom.forms.getValue(this._$searchInput);

    // Show / hide the reset toggle
    goog.style.setStyle(this._$searchReset, 'opacity', query === '' ? '0' : '1');

    if (query.replace(/\s+/g, '').length < 1) {
        goog.style.showElement(this._$results, false);
        return;
    }

    if (this._lastQuery && query === this._lastQuery) {
        return;
    }

    this._lastQuery = query;

    var model = gva.model.DataModel.getInstance();
    var results = model.searchEpisodes(query);

    this.clearResults();
    // Remove current results
    //goog.dom.removeChildren(this._$results);

    // Append results heading
    goog.dom.append(this._$results, this._$info);
    goog.dom.setTextContent(this._$info, results.length + ' Results');

    // Add some results

    var $result;
    var $showLink;
    var $episodeLink;
    var count = Math.min(this.MAX_LIVE_RESULTS, results.length);

    for (var i = 0; i < count; i++) {
        $result = this.makeResult(results[i]);

        // Initialize buttons
        $episodeLink = goog.dom.query('a.episode', $result)[0];
        $showLink = goog.dom.query('a.show', $result)[0];

        // Bind event handlers to the object
        goog.events.listen($episodeLink, goog.events.EventType.CLICK, this.callbacks.onEpisodeClicked);
        goog.events.listen($showLink, goog.events.EventType.CLICK, this.callbacks.onShowClicked);

        goog.dom.append(this._$results, $result);
    }

    if (results.length > 6) {
      // Add "more" link to results page.
      var $more = goog.dom.htmlToDocumentFragment('<li class="more"><a href="#">More...</a></li>');
      goog.events.listen($more, goog.events.EventType.CLICK, this.callbacks.onFormSubmit);

      goog.dom.append(this._$results, $more);
    }

    // Reveal results.
    var startHeight = this._$results.offsetHeight - this.RESULT_BASE_OFFSET;

    // Make visible before animation.
    var initialReveal = !goog.style.isElementShown(this._$results);
    goog.style.showElement(this._$results, true);


    // Calculate the ending height for the result animation.
    var endHeight = count * this.RESULT_LI_HEIGHT;
    endHeight += (endHeight > 0) ? this.RESULT_BOTTOM_MARGIN : 0;
    endHeight += (results.length > 6) ? this.RESULT_MORE_HEIGHT : 0;
    endHeight += this.RESULT_BASE_HEIGHT;


    // Animate height change if different.
    if (startHeight != endHeight) {

      // Hide inner list elements hidden before animating.
      this.toggleResultDisplay(false, !initialReveal);

      var anim = new goog.fx.dom.Resize(this._$results,
        [this.RESULT_WIDTH, startHeight],
        [this.RESULT_WIDTH, endHeight],
        this.RESULT_ANIMATION_DURATION,
        gva.easing.quintic.easeOut
      );

      goog.events.listen(anim, goog.fx.Transition.EventType.END, function() {
        this.toggleResultDisplay(true);
      }, false, this);

      anim.play();
    }


    // Listen for closing clicks.
    goog.events.unlisten(window, goog.events.EventType.CLICK, this.callbacks.handleClick, false);
    goog.events.listen(window, goog.events.EventType.CLICK, this.callbacks.handleClick, false);

    // Deselect results
    this._$selected = null;
};

/**
 * Toggles the display of each li element in the results list to block or none.
 * @param {Boolean} display True to display block, false for none.
 * @param {Boolean} skipIntro True to ignore the first li (which shows the num results).
 */
gva.component.SearchForm.prototype.toggleResultDisplay = function(display, skipIntro) {

  var displayStyle = display ? 'block' : 'none';

  var $resultItems = goog.dom.getElementsByTagNameAndClass('li', null, this._$results);

  for (var i = 0, n = $resultItems.length; i < n; i++) {

    if (i == 0 && skipIntro) {
      continue;
    }

    goog.style.setStyle($resultItems[i], 'display', displayStyle);
  }
};

/**
 * Event handler for when the reset button is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onResetClicked = function(event) {
    event.preventDefault();
    goog.dom.forms.setValue(this._$searchInput, '');
    this.onInputChange(null);
    this.onSearchBlur(null);
};

/**
 * Event handler for when a show link is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onShowClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);
};

/**
 * Event handler for when an episode link is clicked
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onEpisodeClicked = function(event) {

    event.preventDefault();

    var $item = event.currentTarget;
    var title = $item.getAttribute('title');
    var slug = $item.getAttribute('href');

    gva.controller.ApplicationController.navigate(slug, title);
};


/**
 * Event handler for when the search input is submitted.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.onFormSubmit = function(event) {

    // Stop default form behavior
    event.preventDefault();

    // Grab the query from the search field
    var query = goog.dom.forms.getValue(this._$searchInput);

    // Close results view.
    goog.style.showElement(this._$results, false);

    // Go to the search results page
    gva.controller.ApplicationController.navigate('/search/' + query);
};


/**
 * Event handler for all clicks that collapses the component when clicking outside of it.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.SearchForm.prototype.handleClick = function(event) {
  var resultsAncestor = goog.dom.getAncestorByClass(event.target, 'results');
  var isLink = goog.dom.classes.has(event.target, 'episode') || goog.dom.classes.has(event.target.parentNode, 'episode') || goog.dom.classes.has(event.target, 'show');

  if (!resultsAncestor || isLink) {
    // Close results view.
    goog.style.showElement(this._$results, false);

    goog.events.unlisten(window, goog.events.EventType.CLICK, this.callbacks.handleClick, false);
  }
};


/**
 * Export the fully qualified class name of this component for dependency injection
 */
goog.exportSymbol('gva.component.SearchForm', gva.component.SearchForm);
