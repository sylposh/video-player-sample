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
goog.provide('gva.component.Html5Player');

/**
 * Import dependencies
 */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component');
goog.require('goog.ui.Slider');
goog.require('gva.component.BaseComponent');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.Html5Player = function() {

    // Indicates when the user is seeking.
    this.isSeeking = false;

    // The progress bar.
    this.seekSlider = null;

    /**
     * Monitors the viewport size so that the grid can flex.
     * @type {goog.dom.ViewportSizeMonitor}
     */
    this.viewportMonitor = new goog.dom.ViewportSizeMonitor();

    // Whether or not to resume after seeking.
    this.wasPlaying = false;

    /**
     * Enumeration for player event types.
     * @enum {string}
     */
    gva.component.Html5Player.EventType = {
            EPISODE_COMPLETE: 'Html5Player::episodeComplete'
    };

    // Call super constructor
    gva.component.BaseComponent.call(this);
};


/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.Html5Player, gva.component.BaseComponent);


/**
 * @inheritDoc
 */
gva.component.Html5Player.prototype.initialize = function($context) {

    // Call super method
    this.constructor.superClass_.initialize.call(this, $context);

    // Creates the player markup and sets listeners.
    this.createBase();

    // Indicates when the user is seeking.
    this.isSeeking = false;
};


/**
 * Creates the markup for the video player and caches DOM
 * queries for parts of the video player such as controls.
 */
gva.component.Html5Player.prototype.createBase = function() {

  // Markup for video and controls.

  var html = '<div id="html5Player">' +
      '<div class="video-container"><video autoplay preload="auto"></video></div>' +
      '<div class="video-controls">' +
        '<div class="video-controls-wrap">' +
          '<div class="video-play video-button"><span></span></div>' +
          '<div class="video-seek">' +
            '<div class="video-seek-wrap goog-slider-horizontal">' +
              '<span class="bar-bg"></span>' +
              '<span class="bar-fill"></span>' +
              '<span class="bar-knob goog-slider-thumb">' +
                '<span class="knob-graphic"></span>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="video-sound">' +
            '<div class="video-sound-button video-button"><span></span></div>' +
            '<div class="video-sound-panel">' +
              '<div class="video-sound-panel-wrap goog-slider-horizontal">' +
                '<span class="bar-bg"></span>' +
                '<span class="bar-fill"></span>' +
                '<span class="bar-knob goog-slider-thumb">' +
                  '<span class="knob-graphic"></span>' +
                '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="video-time">' +
            '<span class="time-current">00:00</span>' +
            '<span class="time-total">00:00</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  this.root = goog.dom.htmlToDocumentFragment(html);
  goog.dom.appendChild(this.$context, this.root);

  // Cache player elements.

  this.player = goog.dom.getElementByClass('video-container', this.root);
  this.video = goog.dom.getFirstElementChild(this.player);

  this.controls = goog.dom.getElementByClass('video-controls', this.root);
  this.playBtn = goog.dom.getElementByClass('video-play', this.controls);

  this.seekPanel = goog.dom.getElementByClass('video-seek-wrap', this.controls);
  this.seekFill = goog.dom.getElementByClass('bar-fill', this.seekPanel);
  this.seekKnob = goog.dom.getElementByClass('bar-knob', this.seekPanel);

  this.timeCurrent = goog.dom.getElementByClass('time-current', this.controls);
  this.timeTotal = goog.dom.getElementByClass('time-total', this.controls);

  this.soundBtn = goog.dom.getElementByClass('video-sound-button', this.controls);
  this.soundPanel = goog.dom.getElementByClass('video-sound-panel-wrap', this.controls);
  this.soundFill = goog.dom.getElementByClass('bar-fill', this.soundPanel);
  this.soundKnob = goog.dom.getElementByClass('bar-knob', this.soundPanel);


  // Initial event listeners

  // Lock default select behavior.
  goog.events.listen(this.controls, goog.events.EventType.SELECTSTART, function() {
    return false;
  });

  // Listen for video progress and update the seek slider position.
  goog.events.listen(this.video, 'timeupdate', this.onVideoUpdate, false, this);


  // Listen for play/pause toggle clicks.
  goog.events.listen(this.playBtn, goog.events.EventType.CLICK, this.play, false, this);

  // Listen for volume button clicks to toggle mute.
  goog.events.listen(this.soundBtn, goog.events.EventType.CLICK, this.muteToggle, false, this);

  // Listen for end of video.
  goog.events.listen(this.video, 'ended', this.onEnded, false, this);

  // Listen for resize events.
  goog.events.listen(this.viewportMonitor, goog.events.EventType.RESIZE, this.resize, false, this);
};



/**
 * Handler for when the video's ready to play.
 */
gva.component.Html5Player.prototype.onCanPlay = function() {

  // Set initial time display.
  this.timeTotal.innerHTML = this.timeFormat(this.video.duration);

  // Show controls.
  goog.style.setStyle(this.controls, 'display', 'block');

  // Activate seek/volume sliders.
  this.createSliders();

  // Set initial volume.
  this.setVolume(this.video.volume * 100);

  // Set play button state.
  goog.dom.classes.add(this.playBtn, 'playing');

  // Set sizing for IE to avoid flickering when controls are on top of the video.
  if (goog.userAgent.IE) {
    this.IEResizeFix();
  }
};


/**
 * Creates and sets event listeners for
 * seek and volume sliders
 */
gva.component.Html5Player.prototype.createSliders = function() {

  // Create and bind seek slider.
  this.seekSlider = new goog.ui.Slider;
  this.seekSlider.decorate(this.seekPanel);
  this.seekSlider.setMaximum(this.video.duration);
  this.seekSlider.setMoveToPointEnabled(true);
  goog.events.listen(this.seekSlider,
    goog.events.EventType.CHANGE, this.onSeekChange,
    false, this);


  // Create and bind volume slider.
  this.volumeSlider = new goog.ui.Slider;
  this.volumeSlider.decorate(this.soundPanel);
  goog.events.listen(this.volumeSlider,
    goog.events.EventType.CHANGE, this.onVolumeChange,
    false, this);


  // Listen for dragging on the seek slider.
  goog.events.listen(this.seekPanel,
    goog.events.EventType.MOUSEDOWN, this.onSeekStart,
    false, this);
};


/**
 * Sets the src attribute loading the video.
 * @param {String} url The url for the video to be loaded.
 */
gva.component.Html5Player.prototype.loadVideo = function(url) {

  // Load a null video to help convince browsers to free up memory.
  this.video.src = '';
  this.video.load();

  // Load the video by url.
  this.video.src = url;
  this.video.load();


  // Call other setup functions when ready.
  if (this.video.readyState > this.video.HAVE_CURRENT_DATA) {
    this.onCanPlay();
  }
  else {
    goog.events.listen(this.video,
      'canplay', this.onCanPlay,
      false, this);
  }

};


/**
 * Toggles play/pause for the video.
 */
gva.component.Html5Player.prototype.play = function() {

  if (!this.video.src) {
    return;
  }

  if (this.video.paused) {
    this.video.play();
    goog.dom.classes.add(this.playBtn, 'playing');
  }

  else if (this.video.ended) {
    this.video.currentTime = 0;
    this.video.play();
    goog.dom.classes.add(this.playBtn, 'playing');
  }

  else {
    this.video.pause();
    goog.dom.classes.remove(this.playBtn, 'playing');
  }
};


/**
 * Pauses the video.
 */
gva.component.Html5Player.prototype.pause = function() {
  this.video.pause();
};


/**
 * Handles end of video.
 */
gva.component.Html5Player.prototype.onEnded = function() {

  // Create a new event
  var event = new goog.events.Event(gva.component.Html5Player.EventType.EPISODE_COMPLETE);

  // Dispatch the event to subscribers
  this.dispatchEvent(event);
};


/**
 * Toggles mute for the video.
 */
gva.component.Html5Player.prototype.muteToggle = function() {
  if (this.video.muted) {
    this.video.muted = false;
    goog.dom.classes.remove(this.soundBtn, 'sound-off');

    // Bump up volume if set to 0.
    if (this.volumeSlider.getValue() == 0) {
      this.setVolume(50);
    }
  }
  else {
    this.setVolume(0);
    this.video.muted = true;
    goog.dom.classes.add(this.soundBtn, 'sound-off');
  }
};


/**
 * Sets the video volume.
 * @param {Number} volume Integer volume value between 0 and 100.
 */
gva.component.Html5Player.prototype.setVolume = function(volume) {
  this.volumeSlider.setValue(volume);
};


/**
 * Handler for when the video progress updates.
 * Updates the slider and numerical time displays.
 */
gva.component.Html5Player.prototype.onVideoUpdate = function() {

  // Update displayed time.
  this.timeCurrent.innerHTML = this.timeFormat(this.video.currentTime);


  // Don't update while scrubbing since the slider is already being
  // moved to the desired position.

  if (!this.isSeeking) {
    this.seekSlider.setValue(this.video.currentTime);
  }
};


/**
 * Handles mousedown (dragging) events for the seek slider.
 */
gva.component.Html5Player.prototype.onSeekStart = function() {

  if (!this.video.paused && !this.video.ended) {
    this.wasPlaying = true;
  }
  else {
    this.wasPlaying = false;
  }
  this.pause();

  // Unbind scrub start listener.
  goog.events.unlisten(this.seekPanel, goog.events.EventType.MOUSEDOWN, this.onSeekStart, false, this);

  // Listen for scrub stop.
  goog.events.listenOnce(document, goog.events.EventType.MOUSEUP, this.onSeekStop, false, this);

  // Set conditional so only user can reposition
  // the seek slider while scrubbing.
  this.isSeeking = true;


  // Update seek position once right away for single clicks
  // on the slider rather than scrubs.
  this.onSeekChange();
};


/**
 * Handles mouseup events after seeking has stopped.
 */
gva.component.Html5Player.prototype.onSeekStop = function() {

  // Listen for seeking again.
  goog.events.listen(this.seekPanel,
    goog.events.EventType.MOUSEDOWN,
    this.onSeekStart,
    false, this);

  // Allow seek slider to be programmatically updated again.
  this.isSeeking = false;

  if (this.wasPlaying) {
    this.play();
  }
};


/**
 * Handles changes to the video seek slider.
 */
gva.component.Html5Player.prototype.onSeekChange = function() {

  // Update video time position.
  if (this.isSeeking) {
    this.video.currentTime = this.seekSlider.getValue();
  }

  // Keep the slider's fill bar pinned to the knob.
  var knobOffset = goog.style.getStyle(this.seekKnob, 'left');
  goog.style.setStyle(this.seekFill, 'width', knobOffset);
};


/**
 * Handles changes to the sound panel slider.
 */
gva.component.Html5Player.prototype.onVolumeChange = function() {

  // Make sure it's not muted.
  if (this.video.muted) {
    this.muteToggle();
  }

  // Update video volume.
  this.video.volume = this.volumeSlider.getValue() / 100;

  // Keep the slider's fill bar pinned to the knob.
  var knobOffset = goog.style.getStyle(this.soundKnob, 'left');
  goog.style.setStyle(this.soundFill, 'width', knobOffset);
};


/**
 * Handles browser resize events to scale and reorient player elements.
 */
gva.component.Html5Player.prototype.resize = function() {
  if (goog.userAgent.IE) {
    this.IEResizeFix();
  }

  // Refresh seek knob position.
  if (this.seekSlider) {
    this.seekSlider.animatedSetValue(this.seekSlider.getValue());
    goog.Timer.callOnce(this.onSeekChange, 200, this);
  }
};


/**
 * Resizes video element so controls are not on top to prevent flickering in IE.
 */
gva.component.Html5Player.prototype.IEResizeFix = function() {
  var availableHeight = goog.style.getPosition(this.controls).y;
  goog.style.setStyle(this.video, 'height', availableHeight + 'px');
};


/**
 * Formats time as MM:SS.
 * @param {Number} seconds Integer time (s) to format.
 * @return {String} formattedTime containing formatted time.
 */
gva.component.Html5Player.prototype.timeFormat = function(seconds) {

  // Calculate minutes and seconds.
  var m = Math.floor(seconds / 60);
  var s = Math.floor(seconds % 60);

  // Format with leading zeroes.
  var formattedTime = (m < 10) ? '0' + m : m;
  formattedTime += ':';
  formattedTime += (s < 10) ? '0' + s : s;

  return formattedTime;
};


/**
 * Removes the player from the DOM.
 */
gva.component.Html5Player.prototype.destroy = function() {
  this.initialized = false;
  var playerNode = goog.dom.getElement('html5Player');
  goog.dom.removeNode(playerNode);
};


/**
 * Export the fully qualified class name of this component for dependency
 * injection
 */
goog.exportSymbol('gva.component.Html5Player', gva.component.Html5Player);
