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
goog.provide('gva.controller.ApplicationController');

goog.require('goog.History');
/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.dom.dataset');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.fx');
goog.require('goog.fx.dom');
goog.require('goog.history.Html5History');
goog.require('gva.component.ComponentInitializer');
goog.require('gva.controller.ControllerInitializer');
goog.require('gva.easing');
goog.require('gva.model.DataModel');
goog.require('gva.model.UserModel');


/**
 * @constructor
 */
gva.controller.ApplicationController = (function() {

    /**
     * Whether this controller has been initialized
     * @type {boolean}
     */
    var _initialized = false;

    /**
     * True until the first refresh has happened
     * @type {boolean}
     */
    var _firstRefresh = true;

    /**
     * The current history token
     * @type {string}
     */
    var _currentToken = null;

    /**
     * The DOM element containing the application sections
     * @type {Element}
     */
    var _$sectionContainer = null;

    /**
     * The singleton instance of the global header controller
     * @type {gva.controller.HeaderController}
     */
    var _headerController = null;

    /**
     * The singleton instance of the global footer controller
     * @type {gva.controller.FooterController}
     */
    var _footerController = null;

    /**
     * The currently active section controller
     * @type {gva.controller.AbstractController}
     */
    var _currentController = null;

    /**
     * The key of the data load event. Used for unbind handlers
     */
    var _dataLoadEventKey = null;

    /**
     * Section controllers, indexed by slug
     */
    var _controllersBySlug = {};

    /**
     * Application history handler
     * @type {goog.history.Html5History|goog.History}
     */
    var _history = null;

    /**
     * Monitors the viewport size so that the layout can resize when required
     * @type {goog.dom.ViewportSizeMonitor}
     */
    var _viewportMonitor = new goog.dom.ViewportSizeMonitor();

    var _loadConfig = function() {

        this._configRequest = new goog.net.XhrIo();
        goog.events.listenOnce(this._configRequest, goog.net.EventType.COMPLETE, _onConfigLoaded);
        this._configRequest.send('/data/config.json?t=' + new Date().getTime());
    };

    var _loadInitialData = function() {

        var model = gva.model.DataModel.getInstance();
        _dataLoadEventKey = goog.events.listen(model, gva.model.DataModel.EventType.GOT_ALL_DATA, _onInitialDataLoaded, false, this);

        model.getShows();
        model.getEpisodes();
    };

    /**
     * Starts up all controllers associates with sections
     */
    var _registerControllers = function() {

        var slug;
        var type;
        var element;
        var controller;
        var $sectionContainer = goog.dom.getElement('sections');
        var $sections = goog.dom.getElementsByTagNameAndClass('section', null, $sectionContainer);

        /**
         * Walk through each top level section inside the section container
         * For each section, check whether a controller is specified and if so,
         * start up the controller with the section as it's context
         */
        goog.array.forEach($sections, function(element, index) {

            // Retrieve the controller definition from the element's data attribute
            type = goog.dom.dataset.get(element, 'controller');
            if (!type) {
              return;
            }

            // Initialize this controller type with the element as it's context
            controller = gva.controller.ControllerInitializer.initializeController(type, element);

            // Retrieve the slug which this section represents
            slug = goog.dom.dataset.get(element, 'slug');

            // Index this controller by it's section slug
            _controllersBySlug[slug] = controller;
        });

        /**
         * Initialize header controller
         */
        element = goog.dom.getElement('header');
        if (element) {
          type = goog.dom.dataset.get(element, 'controller');

          _headerController = gva.controller.ControllerInitializer.initializeController(type, element);
        }

        /**
         * Initialize footer controller
         */
        element = goog.dom.getElement('footer');
        if (element) {
          type = goog.dom.dataset.get(element, 'controller');

          _footerController = gva.controller.ControllerInitializer.initializeController(type, element);
        }

        /**
         * Initialize subscriptions controller
         */
        element = goog.dom.getElement('subscriptions');
        if (element) {
          type = goog.dom.dataset.get(element, 'controller');

          _subscriptionsController = gva.controller.ControllerInitializer.initializeController(type, element);
        }
    };

    /**
     * Initializes any components in the DOM
     */
    var _registerComponents = function() {
        gva.component.ComponentInitializer.registerComponents();
    };

    /**
     * Registers necessary event handlers
     */
    var _registerListeners = function() {

        // Respond to window resize events
        goog.events.listen(_viewportMonitor, goog.events.EventType.RESIZE, function(event) {
            if (!!_currentController) {
                _scrollContainerTo(_currentController.$context, 0);
            }
        });
    };

    var _onConfigLoaded = function(event) {

        // Set the global config data
        var data = goog.json.parse(event.target.getResponseText());

        // Merge the loaded config with the global config
        goog.mixin(gva.config, data['config']);

        // Load the show data
        _loadInitialData();
    };

    var _onInitialDataLoaded = function(event) {

        // Unsubscribe from the loaded event
        goog.events.unlistenByKey(_dataLoadEventKey);

        // Hide load screen.
        var loadScreen = goog.dom.getElementByClass('load-screen');
        if (loadScreen) {
          fade = new goog.fx.dom.FadeOutAndHide(loadScreen, 150);
          fade.play();
        }

        // First register all components in the DOM
        _registerComponents();

        // Next we can start the controllers
        _registerControllers();

        // Try to use the history API
        _enableHistory();
    };

    /**
     * Event handler for the history state change event
     */
    var _onHistoryNavigate = function(event) {
        event.preventDefault();
        var token = _history.getToken();

        if (token !== _currentToken) {
            _currentToken = token;
            gva.controller.ApplicationController.refresh();
        }
    };

    /**
     * Enable deep linking via history API or fallback
     */
    var _enableHistory = function() {

        // Initialize appropriate history controller
        if (goog.history.Html5History.isSupported()) {
            _history = new goog.history.Html5History();
            goog.events.listen(_history, goog.history.EventType.NAVIGATE, _onHistoryNavigate, false);
            _history.setUseFragment(true);
            _history.setEnabled(true);
        }
        else {
          // Older browser history will require
            $historyInput = goog.dom.getElementsByTagNameAndClass('input', 'ie-history')[0];
            $historyIframe = goog.dom.getElementsByTagNameAndClass('iframe', 'ie-history')[0];
            _history = new goog.History(false, null, $historyInput, $historyIframe);
            goog.events.listen(_history, goog.history.EventType.NAVIGATE, _onHistoryNavigate, false);
            _history.setEnabled(true);
        }
    };

    /**
     * Scrolls the section container to the given coordinates
     * @param {Element} $target The target DOM element to scroll to.
     * @param {number=} duration The duration of the tween in milliseconds.
     */
    var _scrollContainerTo = function($target, duration) {

        if (isNaN(duration)) {
            duration = 450;
        }

        var sx = _$sectionContainer.scrollLeft;
        var sy = _$sectionContainer.scrollTop;

        var tx = $target.offsetLeft;
        var ty = $target.offsetTop;

        if (duration > 0) {
            var animation = new goog.fx.dom.Scroll(_$sectionContainer, [sx, sy], [tx, ty], duration, gva.easing.quintic.easeOut);
            animation.play();
        } else {
            _$sectionContainer.scrollLeft = tx;
            _$sectionContainer.scrollTop = ty;
        }
    };

    /**
     * Public API
     */
    return {

        /**
         * Initializes the controller and starts necessary sub controllers
         */
        initialize: function() {

            if (!_initialized) {

                _$sectionContainer = goog.dom.getElement('sections');

                // Register event handlers
                _registerListeners();

                // Load the application config first
                _loadConfig();

                // Only do all this once!
                _initialized = true;
            }
        },

        /**
         * Navigates to a given path pushes the state into the browser history
         * @param {string} path The full path to navigate to.
         * @param {string=} title An optional page title for the path.
         * @param {Object=} state An optional state object to store against this history item.
         */
        navigate: function(path, title, state) {
            _history.setToken(path, title);
        },

        /**
         * Returns an array containing each segment of the current URL or hash bang
         * @return {Array.<string>} The path segments of the current URL or hash bang.
         */
        getPathSegments: function() {

            // Retrieve the current history token and strip extra slashes
            var token = _history.getToken().replace(/^\/|\/$/g, '');
            var segments = token.split('/');

            return segments;
        },

        /**
         * Refreshes the application state based on the current history token
         */
        refresh: function() {

            // Determine the current path
            var segments = gva.controller.ApplicationController.getPathSegments();

            // Retrieve the controller associated with this section
            var controller = _controllersBySlug[segments[0]];

            // If the controller exists
            if (typeof(controller) !== 'undefined') {

                // Disable the current controller if different
                if (_currentController && _currentController !== controller) {
                    _currentController.disable();
                }

                // Are we changing controller or not
                var isCurrent = _currentController === controller;

                // Activate the section controller
                _currentController = controller;
                _currentController.enable();

                // Scroll to the current section
                _scrollContainerTo(_currentController.$context, _firstRefresh ? 0 : 450);

                // Refresh the footer
                _footerController.refresh();

                // Any subsections are the responsibility of the section controller
                if (typeof(_currentController.navigate) === 'function') {

                    // Clone the segments array and strip out root segment
                    var subsections = segments.concat();
                    subsections.shift();

                    // Tell the section controller to handle subsections
                    _currentController.navigate(subsections, _firstRefresh || !isCurrent);
                }
            } else if (segments[0] === '') {

                // Refresh the footer on the home page
                if (_footerController) {
                  _footerController.refresh();
                }
            }

            _firstRefresh = false;
        }
    };

})();
