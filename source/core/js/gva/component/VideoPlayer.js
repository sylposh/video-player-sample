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
goog.provide('gva.component.VideoPlayer');

/**
 * Import dependencies
 */
goog.require('goog.dom');

goog.require('gva.component.BaseComponent');
goog.require('gva.component.Html5Player');
goog.require('gva.vo.Episode');

/**
 * @constructor
 * @extends {gva.component.BaseComponent}
 */
gva.component.VideoPlayer = function() {

    this._usingDefaultPlayer = true;
    this._$videoContainer = null;
    this._HTML5VideoPlayer = null;
    this._pendingEpisode = null;
    this._modulesInitialised = false;

    this._paused = false;

    /**
     * Enumeration for player event types.
     * @enum {string}
     */
    gva.component.VideoPlayer.EventType = {
            EPISODE_COMPLETE: 'VideoPlayer::episodeComplete'
    };
};

/**
 * Flash paramters.
 * @enum {string}
 */
gva.component.VideoPlayer.CONFIG = {
        minFlashVersion: '9.0.0',
        videoPlayerID: 'video-container'
};

/**
 * Extend gva.component.BaseComponent
 */
goog.inherits(gva.component.VideoPlayer, gva.component.BaseComponent);

/**
 * ExternalInterface event handler for Flash video player media events
 * @param {Flash video event} type The type of video playback event.
 */
gva.component.VideoPlayer.onVideoEvent = function(type) {};

/**
 * @inheritDoc
 */
gva.component.VideoPlayer.prototype.initialize = function($context) {

    // Call super method
    this.constructor.superClass_.initialize.call(this, $context);

    // Create a container element for the video player
    this._$videoContainer = goog.dom.createDom('div', {
        id: gva.component.VideoPlayer.CONFIG.videoPlayerID
        });

    // Append the player container to the contex
    goog.dom.append(this.$context, this._$videoContainer);

    // Try to create default html5 player.
    if (Modernizr.video) {
        this.createDefaultPlayer();
    }
    // Try to fallback and embed flash player.
    else if (swfobject.hasFlashPlayerVersion(gva.component.VideoPlayer.CONFIG.minFlashVersion)) {
        this.createFallbackPlayer();
    }
    else {
      // No compatible formats available.
      return false;
    }

    // Scope the media event handler for ExternalInterface
    gva.component.VideoPlayer.onVideoEvent = goog.bind(this.onVideoEvent, this);
    goog.exportProperty(gva.component.VideoPlayer, 'onVideoEvent', gva.component.VideoPlayer.onVideoEvent);
};

/**
 * Attempts to create and initialize the default video player. If this fails, the
 * fallback is embedded instead via #createFallbackPlayer
 */
gva.component.VideoPlayer.prototype.createDefaultPlayer = function() {
    this._usingDefaultPlayer = true;

    // Initialize the HTML5 player component
    this._HTML5VideoPlayer = gva.component.ComponentInitializer.initializeComponent('gva.component.Html5Player', this._$videoContainer);

    goog.events.listen(this._HTML5VideoPlayer, gva.component.Html5Player.EventType.EPISODE_COMPLETE, this.onEpisodeComplete, false, this);
};

/**
 * Creates and initializes the fallback video player
 */
gva.component.VideoPlayer.prototype.createFallbackPlayer = function() {

  this._usingDefaultPlayer = false;

  var self = this;
  var videoURL = this._pendingEpisode;
  var theme = gva.config['flash_theme'];

  var flashvars = {
    'videoURL' : videoURL,
    'spriteSheetURL' : '/themes/os/img/video-player.png',
    'callbackMethod' : 'gva.component.VideoPlayer.onVideoEvent',
    'fitMode' : 'letterbox', // 'crop' || 'letterbox'
    'autoPlay' : 0, // '0' || '1'
    'inactivityDelay' : 1200,
    'backgroundColour' : '0x' + theme['backgroundColour'],
    'guiControlsColour' : '0x' + theme['guiControlsColour'],
    'guiControlsShadowAlpha' : theme['guiControlsShadowAlpha'],
    'guiTrackBackColour' : '0x' + theme['guiTrackBackColour'],
    'guiTrackFillColour' : '0x' + theme['guiTrackFillColour'],
    'guiTrackShadowAlpha' : theme['guiTrackShadowAlpha'],
    'guiDurationTextColour' : '0x' + theme['guiDurationTextColour'],
    'guiTimeTextColour' : '0x' + theme['guiTimeTextColour']
  };

  var params = {
    'menu' : 'false',
    'allowFullscreen' : 'true',
    'allowScriptAccess' : 'always',
    'wmode' : 'transparent'
  };

  var attributes = {
    'id' : gva.component.VideoPlayer.CONFIG.videoPlayerID,
    'name' : gva.component.VideoPlayer.CONFIG.videoPlayerID
  };

  swfobject.embedSWF(
    '/core/swf/videoplayer.swf',
    gva.component.VideoPlayer.CONFIG.videoPlayerID,
    '100%',
    '100%',
    gva.component.VideoPlayer.CONFIG.minFlashVersion,
    '/core/swf/expressinstall.swf',
    flashvars,
    params,
    attributes,
    function(result) {
      /*
      if (result['success'] === true) {
        // Flash player embedded
      }*/
    }
  );
};

/**
 * Tells the currently embedded player to play a given episode
 * @param {gva.vo.Episode} episode The episode to play. If not supplied
 * then this._pendingEpisode will be attempted.
 */
gva.component.VideoPlayer.prototype.loadEpisode = function(episode) {

    // See if we're trying to play a pending episode again or a new one.
    if (!episode && this._pendingEpisode) {
      episode = this._pendingEpisode;
      this._pendingEpisode = null;
    }

    if (this._usingDefaultPlayer) {

      // Determine supported format.
      for (var i = 0, n = episode.video_html.length; i < n; i++) {

        var supported = false;

        switch (episode.video_html[i].type) {
          case 'webm':
            supported = Modernizr.video.webm;
            break;
          case 'ogg':
            supported = Modernizr.video.ogg;
            break;
          case 'h264':
            supported = Modernizr.video.h264;
            break;
          default:
            // Unsupported video type specified
            break;
        }

        if (supported) {
          this._HTML5VideoPlayer.loadVideo(episode.video_html[i].path);
          return;
        }
      }

      // No supported html video types found - attempt to create fallback flash player
      this._HTML5VideoPlayer.destroy();
      this.createFallbackPlayer(episode);
    }

    else {
      var player = goog.dom.getElement(gva.component.VideoPlayer.CONFIG.videoPlayerID);
      try {
        player['load'](episode.video_flash.path);
        this._pendingEpisode = null;
      } catch (error) {
          // console.log('loadEpisode :: error', error, episode);
          // Wait for the player to become ready
          var self = this;
          this._pendingEpisode = episode;
          setTimeout(function() {
            self.loadEpisode();
          }, 500);
      }
    }
};


/**
 * Plays the loaded episode.
 */
gva.component.VideoPlayer.prototype.play = function() {
    if (this._usingDefaultPlayer) {
      this._HTML5VideoPlayer.play();
    } else {
      var player = goog.dom.getElement(gva.component.VideoPlayer.CONFIG.videoPlayerID);
      try {
        if (this._paused) {
          player['resume']();
        }
        else {
          player['play']();
        }
      } catch (error) {
          //console.log('play :: error', error);
      }
    }

    this._paused = false;
};


/**
 * Pauses the loaded episode.
 */
gva.component.VideoPlayer.prototype.pause = function() {
    this._paused = true;

    if (this._usingDefaultPlayer) {
      this._HTML5VideoPlayer.pause();
    } else {
      var player = goog.dom.getElement(gva.component.VideoPlayer.CONFIG.videoPlayerID);
      try {
          player['pause']();
      } catch (error) {
          //console.log('error', error);
      }
    }
};


/**
 * Calls resize on the html5 player if present.
 */
gva.component.VideoPlayer.prototype.resize = function() {
    if (this._HTML5VideoPlayer) {
        this._HTML5VideoPlayer.resize();
    }
};


/**
 * Handles all flash player video events - listed here for reference.
 * @param {Flash video event} event Any event broadcasted from the flash player.
 */
gva.component.VideoPlayer.prototype.onVideoEvent = function(event) {

  switch (event.type) {

    case 'metaData':
      //console.log('onVideoEvent:', event.type, event.data.duration);
      break;
    case 'load':
      //console.log('onVideoEvent:', event.type, event.data.url);
      break;
    case 'play':
      this._paused = false;
      //console.log('onVideoEvent:', event.type);
      break;
    case 'pause':
      this._paused = true;
      //console.log('onVideoEvent:', event.type);
      break;
    case 'resume':
      this._paused = true;
      //console.log('onVideoEvent:', event.type);
      break;
    case 'stop':
      this._paused = true;
      //console.log('onVideoEvent:', event.type);
      break;
    case 'seek':
      //console.log('onVideoEvent:', event.type, event.data.time, event.data.ratio);
      break;
    case 'volume':
      //console.log('onVideoEvent:', event.type, event.data.volume);
      break;
    case 'mute':
      //console.log('onVideoEvent:', event.type);
      break;
    case 'buffering':
      //console.log('onVideoEvent:', event.type);
      break;
    case 'start':
      //console.log('onVideoEvent:', event.type);
      break;
    case 'progress':
      //console.log('onVideoEvent:', event.type, event.data.time, event.data.ratio);
      break;
    case 'complete':
      this.onEpisodeComplete();
      //console.log('onVideoEvent:', event.type);
      break;
    case 'error':
      //console.log('onVideoEvent:', event.type);
      break;
    case 'resize':
      //console.log('onVideoEvent:', event.type, event.data.width, event.data.height);
      break;
    default:
      break;
  }
};


/**
 * Handles end of video.
 */
gva.component.VideoPlayer.prototype.onEpisodeComplete = function() {
  // Create a new event
  var event = new goog.events.Event(gva.component.VideoPlayer.EventType.EPISODE_COMPLETE);

  // Dispatch the event to subscribers
  this.dispatchEvent(event);
};

/**
 * Export the fully qualified class name of this component for dependency
 * injection
 */
goog.exportSymbol('gva.component.VideoPlayer', gva.component.VideoPlayer);
