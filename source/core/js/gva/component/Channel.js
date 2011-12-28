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
goog.provide('gva.component.Channel');

goog.require('goog.events.MouseWheelHandler');
/**
 * Import dependencies
 */
goog.require('goog.ui.Component');
goog.require('goog.ui.Slider');
goog.require('gva.component.BaseComponent');
goog.require('gva.component.Html5Player');
goog.require('gva.component.VideoPlayer');
goog.require('gva.easing');
goog.require('gva.model.UserModel');
goog.require('gva.util.DateUtil');
goog.require('gva.util.Notify');
goog.require('gva.util.StringUtil');



/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.Channel = function() {
    // Call super constructor
    gva.component.BaseComponent.call(this);

    // Episode list container.
    this.$episodeList = null;

    // The section element within the list container - used for scrolling logic.
    this.$episodeListContainer = null;

    /**
     * A list of episode item DOM elements
     * @type {Array.<Element>}
     */
    this.$episodes = [];

    // A list of episode data objects
    this.episodeData = {};

    // Component instances to be cached.
    this.player = null;
    this.userModel = null;

    // Utility for now playing notifications.
    this.notifier = new gva.util.Notify();

    // Scrollbar object.
    this.scroller = null;

    // Scrollbar element.
    this.$scrollerWrap = null;
    this.$scrollContainer = null;

    // Handles mousewheel events on episode list.
    this.mouseWheelHandler = null;

    // Scrolling interval used while holding up/down scroll buttons.
    this.scrollInterval = null;

    /**
     * Monitors the viewport size so that the grid can flex.
     * @type {goog.dom.ViewportSizeMonitor}
     */
    this.viewportMonitor = new goog.dom.ViewportSizeMonitor();

    // Sort direction (ascending or descending by airdate).
    this.SORT_ORDER = {
      ASCENDING: 'ascending',
      DESCENDING: 'descending'
    };

    this.currentSortOrder = this.SORT_ORDER.DESCENDING;

    this.groupedByShow = true;

    /**
     * Enumeration for event types dispatched from this class
     */
    gva.component.Channel.EventType = {
            /**
             * Dispatched when component needs to get data again (sorting methods)
             */
            REFRESH_REQUESTED: 'Channel::refreshRequested'
    };

    // Duration of accordion slide animations.
    this.ACCORDION_SLIDE_DURATION = 350;
};


/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.Channel, gva.component.BaseComponent);


/**
 * @inheritDoc
 */
gva.component.Channel.prototype.initialize = function($context) {
  this.constructor.superClass_.initialize.call(this, $context);

  // Get user model instance.
  this.userModel = gva.model.UserModel.getInstance();

  // Episode list.
  this.$episodeList = goog.dom.getElementsByTagNameAndClass('ul', null, this.$context)[0];

  // Episode list container.
  this.$episodeListContainer = goog.dom.getElement('episode-list');

  // Expand/Collapse Button.
  this.$toggle = goog.dom.getElementByClass('toggle', this.$context);

  // Create scrollbar.
  this.$scrollerWrap = goog.dom.getElement('channel-slider');

  this.$scrollContainer = goog.dom.getElementByClass('channel-scroll', this.$context);
  this.createScroller();

  // Listen for resize events.
  goog.events.listen(this.viewportMonitor, goog.events.EventType.RESIZE, this.refreshScroller, false, this);

  // Listen for expand/collapse button clicks.
  goog.events.listen(this.$toggle, goog.events.EventType.CLICK, this.toggleChannels, false, this);

  // Listen for sort button clicks.
  var $sortButtons = goog.dom.query('.sort a');
  for (var i = 0, n = $sortButtons.length; i < n; i++) {
    goog.events.listen($sortButtons[i], goog.events.EventType.CLICK, this.onSortClick, false, this);
  }
};


/**
 * Sets the video player to be used.
 * @param {Object} player The video player component instance.
 */
gva.component.Channel.prototype.setPlayer = function(player) {
  this.player = player;

  goog.events.listen(this.player, gva.component.VideoPlayer.EventType.EPISODE_COMPLETE, this.onEpisodeComplete, false, this);
};



/**
 * Adds an episode to the list based on current sorting/grouping states.
 * @param {gva.vo.Episode} episode Episode data.
 */
gva.component.Channel.prototype.addEpisode = function(episode) {

  var episodeNode = this.createEpisodeNode(episode);

  // Before adding to channel determine the episode's container.

  // Default to base episode list as container (ungrouped sorting)
  var $episodeContainer = this.$episodeList;

  if (this.groupedByShow) {

    goog.dom.classes.add(this.$episodeList, 'accordion');

    // Find or create the show's accordion tab.
    var $showTab = goog.dom.getElement('tab-' + episode.show_id, this.$episodeList);

    if (!$showTab) {

      // Create the show's accordion tab if none found.
      var showTabMarkup = '' +
        '<li id="tab-' + episode.show_id + '">' +
          '<a class="show-tab">' +
            '<h3><span class="icon"></span>' + episode.show_title + '</h3>' +
          '</a>' +
          '<ul></ul>' +
        '</li>';

      var showTabNode = goog.dom.htmlToDocumentFragment(showTabMarkup);
      var $accordionButton = goog.dom.getElementByClass('show-tab', showTabNode);

      // Listen for accordion clicks.
      goog.events.listen($accordionButton, goog.events.EventType.CLICK, this.onShowTabClicked, false, this);

      // Add show tab to dom.
      goog.dom.appendChild(this.$episodeList, showTabNode);

      $showTab = goog.dom.getElement('tab-' + episode.show_id, this.$episodeList);
    }

    // Set destination to episode list in the existing or newly created show tab.
    $episodeContainer = goog.dom.getElementsByTagNameAndClass('ul', null, $showTab)[0];
  }

  // Add to appropriate container.
  goog.dom.appendChild($episodeContainer, episodeNode);

  // Store a references
  this.$episodes.push(episodeNode);
  this.episodeData[episode.id] = episode;

  this.refreshScroller();
};


/**
 * Creates the episode markup and sets listeners.
 * @param {gva.vo.Episode} episode Episode data.
 * @return {Element} The episode element.
 */
gva.component.Channel.prototype.createEpisodeNode = function(episode) {
  // Format air date.
  var t = new Date(episode.airdate);
  var airDate = gva.util.DateUtil.formatDate(t, 'M j, Y');

  // Trim episode description.
  var description = gva.util.StringUtil.stripTags(episode.description);
  description = gva.util.StringUtil.singleSentence(description, 5);

  var episodeMarkup = '' +
    '<li id="' + episode.id + '" class="episode-container">' +
      '<div class="episode">' +
        '<figure>' +
          '<img src="' + episode.image_url + '" />' +
          '<a class="play">play</a>' +
          '<span>Now Playing</span>' +
        '</figure>' +
        '<h3>' + episode.title + '</h3>' +
        '<p class="description">' + description + '</p>' +
        '<p class="details">Air Date: ' + airDate + '</p>' +
        '<a class="show-link" href="#"><span class="icon"></span>' + episode.show_title + '</a>' +
      '</div>' +
    '</li>';


  var episodeNode = null;

  if (goog.userAgent.IE && goog.userAgent.VERSION < 9) {
    // Create show element for older browsers.
    episodeNode = innerShiv(episodeMarkup, false)[0];
  }
  else {
    // Create a DOM element from the markup fragment
    episodeNode = goog.dom.htmlToDocumentFragment(episodeMarkup);
  }


  var $showLink = goog.dom.query('a.show-link', episodeNode)[0];

  // Configure button attributes
  var showSlug = gva.util.StringUtil.slugify(episode.show_title);
  goog.dom.setProperties($showLink, {title: episode.show_title, href: '/shows/' + showSlug + '/'});


  // Set event listeners.

  // Show page links.
  goog.events.listen($showLink, goog.events.EventType.CLICK, this.onShowLinkClicked, false, this);

  // Play button click listener.
  var $playBtn = goog.dom.query('.episode figure', episodeNode)[0];
  goog.events.listen($playBtn, goog.events.EventType.CLICK, this.onPlayClick, false, this);

  return episodeNode;
};


/**
 * Click handler for episode list play button clicks that loads the clicked episode.
 * @param {goog.events.BrowserEvent} event A click event from a channel episode.
 */
gva.component.Channel.prototype.onPlayClick = function(event) {

  // Get episode data.
  var ep = goog.dom.getAncestorByTagNameAndClass(event.target, 'li');

  /**
   * @type {gva.vo.Episode}
   */
  var episode = this.episodeData[ep.id];

  gva.controller.ApplicationController.navigate('/home/' + episode.slug, episode.title);
};


/**
 * Click handler for episode remove button clicks.
 * @param {goog.events.BrowserEvent} event A click event from a channel episode.
 */
gva.component.Channel.prototype.onRemoveClick = function(event) {
  var ep = goog.dom.getAncestorByTagNameAndClass(event.target, 'li');
  this.removeEpisode(ep);
};


/**
 * Plays an episode and handles all related events including notification, displaying
 * the episode as 'now playing' in the channel list, and adding the episode to the
 * channel list if it wasn't found.
 * @param {gva.vo.Episode} episode Episode data from the feed.
 */
gva.component.Channel.prototype.playEpisode = function(episode) {

  // Highlight episode in channel.
  this.setNowPlaying(episode.id);

  // Start video playback.
  var self = this;
  setTimeout(function() {
    self.player.loadEpisode(episode);
  }, 500);

  // Show notification.
  this.notifier.showNotification('episode', episode);
};


/**
 * Updates now-playing episode in channel and scrolls it into view.
 * @param {number} episodeID The episode id to highlight as now playing.
 */
gva.component.Channel.prototype.setNowPlaying = function(episodeID) {
  // Remove highlight class from previously played episode.
  var $previousEpisode = goog.dom.getElementByClass('now-playing', this.$episodeList);
  if ($previousEpisode) {
    goog.dom.classes.remove($previousEpisode, 'now-playing');
  }

  // Find and highlight/scroll to next episode.
  var $nextEpisode = goog.dom.getElement(episodeID);

  if (this.groupedByShow) {
    // Make sure that tab's accordion is open.
    var $nextEpisodeShowTab = $nextEpisode.parentNode.parentNode;

    if (!goog.dom.classes.has($nextEpisodeShowTab, 'expanded')) {
      this.toggleTab($nextEpisodeShowTab, false);
    }
  }

  // Highlight next episode.
  goog.dom.classes.add($nextEpisode, 'now-playing');

  // Scroll next episode into view.
  var scroll = new goog.fx.dom.Scroll(this.$episodeListContainer,
      [0, this.$episodeListContainer.scrollTop],
      [0, $nextEpisode.offsetTop],
      150, goog.fx.easing.easeOut);
  scroll.play();

  goog.events.listen(scroll, goog.fx.Transition.EventType.END, goog.bind(this.refreshScroller, this));
};


/**
 * Removes and episode from the channel list.
 * @param {element} episode The episode dom node to be removed.
 */
gva.component.Channel.prototype.removeEpisode = function(episode) {
  delete this.episodeData[episode.id];
  goog.dom.removeNode(episode);
  goog.array.remove(this.$episodes, episode);
  this.userModel.setWatchedEpisode(episode.id);

  this.refreshScroller();
};


/**
 * Resets the channel by clearing out the episode nodes and data.
 */
gva.component.Channel.prototype.reset = function() {
  goog.dom.removeChildren(this.$episodeList);
  this.$episodes = [];
  this.episodeData = {};
};


/**
 * Toggles the channel playlist expanded state.
 */
gva.component.Channel.prototype.toggleChannels = function() {

  // Get the width of the channel component to determine how far we need to slide it.
  var channelWidth = goog.style.getBorderBoxSize(this.$context).width;

  // Slide channel and player components left and toggle 'expanded' class.
  if (goog.dom.classes.has(this.$context, 'expanded')) {

    // Slide left.
    goog.style.setStyle(this.$context, 'left', '-' + channelWidth + 'px');
    goog.style.setStyle(this.player.$context, 'left', '0');

    // Toggle class.
    goog.dom.classes.remove(this.$context, 'expanded');
  }
  else {

    // Slide right.
    goog.style.setStyle(this.$context, 'left', '0');
    goog.style.setStyle(this.player.$context, 'left', channelWidth + 'px');

    // Toggle class.
    goog.dom.classes.add(this.$context, 'expanded');
  }

  // Refresh player controls if not playing.
  goog.Timer.callOnce(this.player.resize, 400, this.player);
};


/**
 * Event handler for when an episode's show link is clicked.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Channel.prototype.onShowLinkClicked = function(event) {

  event.preventDefault();

  // Get the show page info and go there.
  var $item = event.currentTarget;
  var title = $item.getAttribute('title');
  var slug = $item.getAttribute('href');

  gva.controller.ApplicationController.navigate(slug, title);

};


/**
 * Event handler for when a sort by link is clicked.
 * Updates the sorting options and then calls the sort method.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Channel.prototype.onSortClick = function(event) {

  var $clickedBtn = event.currentTarget;

  // See what criteria we should use to sort the episodes with.
  var sortby = goog.dom.dataset.get($clickedBtn, 'sortby');

  // Determine sort state and update styles.
  if (sortby == 'airdate') {

    if (goog.dom.classes.has($clickedBtn, 'ascending')) {
      goog.dom.classes.remove($clickedBtn, 'ascending');
      this.currentSortOrder = this.SORT_ORDER.DESCENDING;
    }
    else {
      goog.dom.classes.add($clickedBtn, 'ascending');
      this.currentSortOrder = this.SORT_ORDER.ASCENDING;
    }
  }
  else {
    if (goog.dom.classes.has($clickedBtn, 'grouped')) {
      goog.dom.classes.remove($clickedBtn, 'grouped');
      this.groupedByShow = false;
    }
    else {
      goog.dom.classes.add($clickedBtn, 'grouped');
      this.groupedByShow = true;
    }
  }


  this.sortEpisodes();
};


/**
 * Sorts the episodes based on current sorting options (grouping and order).
 * Note that these options must be set prior to calling this function.
 */
gva.component.Channel.prototype.sortEpisodes = function() {

  // Temp copy of the episode data.
  /**
   * @type {Array.<gva.vo.Episode>}
   */
  var episodes = [];
  for (var ep in this.episodeData) {
    episodes.push(this.episodeData[ep]);
  }

  // Remember which episode is currently playing.
  var $nowPlayingEl = goog.dom.getElementByClass('now-playing', this.$episodeList);
  var nowPlayingID = null;

  if ($nowPlayingEl) {
    nowPlayingID = goog.dom.getElementByClass('now-playing', this.$episodeList).id;
  }


  // Clear current list of episodes.
  this.reset();

  var i, n;

  // Set sorting method.
  var sortMethod = (this.currentSortOrder == this.SORT_ORDER.DESCENDING) ? this.sortByAirdateDescending : this.sortByAirdateAscending;

  if (this.groupedByShow) {

    // Separate episodes by show.
    var episodesByShow = {};

    for (i = 0, n = episodes.length; i < n; i++) {
      if (episodesByShow[episodes[i].show_title]) {
        episodesByShow[episodes[i].show_title].push(episodes[i]);
      }
      else {
        episodesByShow[episodes[i].show_title] = [];
        episodesByShow[episodes[i].show_title].push(episodes[i]);
      }
    }

    // Empty original episode list before merging newly grouped/sorted episodes.
    episodes = [];

    // Sort each grouping and merge.
    for (var show in episodesByShow) {
      episodesByShow[show].sort(sortMethod);
      episodes = episodes.concat(episodesByShow[show]);
    }
  }

  else {
    // Sort without grouping.
    episodes.sort(sortMethod);
  }

  // Repopulate channel playlist.
  for (i = 0, n = episodes.length; i < n; i++) {
    this.addEpisode(episodes[i]);
  }

  // Reset now playing highlight to original episode.
  if (nowPlayingID) {
   this.setNowPlaying(nowPlayingID);
  }
};


/**
 * Sorts function for video data by airdate in descending order.
 * @param {object} a Video object.
 * @param {object} b Video object.
 * @return {Number} The difference (a - b) between video airdate timestamps.
 */
gva.component.Channel.prototype.sortByAirdateAscending = function(a, b) {
  var aTime = new Date(a.airdate);
  var bTime = new Date(b.airdate);

  return (aTime.getTime() - bTime.getTime());
};


/**
 * Sorts function for video data by airdate in descending order.
 * @param {object} a Video object.
 * @param {object} b Video object.
 * @return {Number} The difference (b - a) between video airdate timestamps.
 */
gva.component.Channel.prototype.sortByAirdateDescending = function(a, b) {
  var aTime = new Date(a.airdate);
  var bTime = new Date(b.airdate);

  return (bTime.getTime() - aTime.getTime());
};


/**
 * End video playback handler.
 */
gva.component.Channel.prototype.onEpisodeComplete = function() {

  // Move to next video in playlist.
  var $currentEpisode = goog.dom.getElementByClass('now-playing', this.$episodeList);
  var $nextEpisode = null;

  if (!$currentEpisode) {
    // Grab the first video in the list.
    $nextEpisode = goog.dom.getElementByClass('episode-container', this.$episodeList);
  }
  else {
    
    // Mark current episode as watched in user model.
    this.userModel.setWatchedEpisode($currentEpisode.id);
    
    // Lookup next video in stored video array.
    var currentIndex = goog.array.indexOf(this.$episodes, $currentEpisode);
    
    var nextIndex = currentIndex + 1;
    if ((currentIndex == -1) || (currentIndex == this.$episodes.length - 1)) {
      nextIndex = 0;
    }

    $nextEpisode = goog.dom.getElement(this.$episodes[nextIndex]['id']);
  }


  var episode = this.episodeData[$nextEpisode['id']];
  gva.controller.ApplicationController.navigate('/home/' + episode.slug, episode.title);
};


/**
 * Event handler for when a show tab link in the accordion is clicked.
 * @param {goog.events.Event} event The event which triggered the handler.
 */
gva.component.Channel.prototype.onShowTabClicked = function(event) {
  this.toggleTab(event.currentTarget.parentNode, true);
};


/**
 * Toggle accordion open/close with optional animation.
 * @param {Element} $tab The li tab element to toggle.
 * @param {Boolean} animated Optional animation control - set to false to expand without slide animation.
 */
gva.component.Channel.prototype.toggleTab = function($tab, animated) {
  if (!animated) {
    goog.dom.classes.toggle($tab, 'expanded');
    this.refreshScroller();
  }

  else {

    var expanding = !goog.dom.classes.has($tab, 'expanded');

    // Get start/end sizings.
    var start = goog.style.getBounds($tab);
    goog.dom.classes.toggle($tab, 'expanded');
    var end = goog.style.getBounds($tab);
    goog.dom.classes.toggle($tab, 'expanded');


    var anim = new goog.fx.dom.Resize($tab,
      [start.width, start.height],
      [end.width, end.height],
      this.ACCORDION_SLIDE_DURATION,
      gva.easing.quintic.easeOut
    );

    // Show content before animating if expanding.
    goog.events.listen(anim, goog.fx.Transition.EventType.BEGIN, function() {
      if (expanding) {
       goog.dom.classes.add($tab, 'expanded');
      }
      else {
        goog.dom.classes.add($tab, 'closing');
      }
    });

    // Clear height styles and toggle hidden if closing.
    goog.events.listen(anim, goog.fx.Transition.EventType.END, goog.bind(function() {
      goog.style.setStyle($tab, 'height', '');
      if (!expanding) {
       goog.dom.classes.remove($tab, 'expanded');
       goog.dom.classes.remove($tab, 'closing');
      }

      this.refreshScroller();

    }, this));

    anim.play();
  }

};


/**
 * Creates and sets event listeners for the scrollbar.
 */
gva.component.Channel.prototype.createScroller = function() {

  // Create and bind seek slider.
  this.scroller = new goog.ui.Slider();
  this.scroller.setOrientation(goog.ui.Slider.Orientation.VERTICAL);
  this.scroller.orientation_ = 'vertical';
  this.scroller.decorate(this.$scrollerWrap);
  this.scroller.setValue(100);
  this.scroller.setMoveToPointEnabled(true);

  // Listen for changes to the scroller.
  goog.events.listen(this.scroller,
    goog.events.EventType.CHANGE, this.onScrollChange,
    false, this);

  // Listen for scroll button up/down interaction.
  var scrollButtons = goog.dom.getElementsByClass('scroll-button', this.$context);

  for (var i = 0, n = scrollButtons.length; i < n; i++) {

    var button = scrollButtons[i];

    goog.events.listen(button,
      goog.events.EventType.MOUSEDOWN, this.onScrollButtonMousedown,
      false, this);

    goog.events.listen(button,
      goog.events.EventType.MOUSEUP, this.onScrollButtonStop,
      false, this);
  }

  // Listen for mousewheel events over the content area.
  var MouseWheelHandler = goog.events.MouseWheelHandler;
  var MOUSEWHEEL = MouseWheelHandler.EventType.MOUSEWHEEL;

  this.mouseWheelHandler = new MouseWheelHandler(this.$episodeListContainer);

  goog.events.listen(this.mouseWheelHandler, MOUSEWHEEL,
    this.handleMouseWheel, false, this);
};


/**
 * Refreshes position of scrollbar to accomodate changed content.
 */
gva.component.Channel.prototype.onScrollChange = function() {

  var scrollValue = this.scroller.getValue();
  var contentHeight = goog.style.getSize(this.$episodeList).height;
  var containerHeight = goog.style.getSize(this.$episodeListContainer).height;

  // Calculate what proportion of the content height to scroll.
  var scrollTo = (1 - scrollValue / 100) * (contentHeight - containerHeight);
  scrollTo = scrollTo.toFixed(2);

  this.$episodeListContainer.scrollTop = scrollTo;
};


/**
 * Refreshes position of scrollbar to accomodate changed content.
 */
gva.component.Channel.prototype.refreshScroller = function() {
  var scrollOffset = this.$episodeListContainer.scrollTop;
  var contentHeight = goog.style.getSize(this.$episodeList).height;
  var containerHeight = goog.style.getSize(this.$episodeListContainer).height;
  var scrollableHeight = contentHeight - containerHeight;

  // Calculate the proportional value (0-100) to set the scroller to.
  var adjustedValue = 100 * (1 - (scrollOffset / scrollableHeight).toFixed(4));

  this.scroller.setValue(adjustedValue);

  // Hide scroller thumb if no scrolling can be done.
  if (contentHeight <= containerHeight) {
    goog.style.showElement(this.$scrollContainer, false);
  }
  else {
    goog.style.showElement(this.$scrollContainer, true);
  }
};


/**
 * Forwards a mousewheel event to the scroller's mousewheel handler.
 * @param {goog.events.MouseWheelEvent} event The mouse wheel event object.
 */
gva.component.Channel.prototype.handleMouseWheel = function(event) {
  this.scroller.handleMouseWheel_(event);
};


/**
 * Handles a mousedown on the scroller up/down buttons
 * @param {goog.events.BrowserEvent} event The event which triggered the handler.
 */
gva.component.Channel.prototype.onScrollButtonMousedown = function(event) {

  var direction = goog.dom.classes.has(event.currentTarget, 'up') ? 1 : -1;
  var contentHeight = Math.max(1, goog.style.getSize(this.$episodeList).height);
  var containerHeight = goog.style.getSize(this.$episodeListContainer).height;

  // Scroll more for less content since thumb doesn't scale.
  var step = Math.round(direction * 8 * containerHeight / contentHeight);
  step = (step == 0) ? direction : step;

  // Start scrolling.
  this.scrollInterval = setInterval(goog.bind(function() {
    var nextValue = this.scroller.getValue() + step;

    // Check bounds.
    nextValue = Math.min(100, nextValue);
    nextValue = Math.max(0, nextValue);

    this.scroller.setValue(nextValue);
  }, this), 100);

  // Listen for mouseout to stop scrolling (mouseup is already being listened for).
  goog.events.listenOnce(event.currentTarget,
    goog.events.EventType.MOUSEOUT, this.onScrollButtonStop,
    false, this);
};


/**
 * Stops scrolling after a mouseup/mouseout event following a scroll button press.
 * @param {goog.events.BrowserEvent} event The event which triggered the handler.
 */
gva.component.Channel.prototype.onScrollButtonStop = function(event) {
  clearInterval(this.scrollInterval);
};





/**
 * Export the fully qualified class name of this component for dependency injection
 */
goog.exportSymbol('gva.component.Channel', gva.component.Channel);
