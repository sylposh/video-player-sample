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
goog.provide('gva.util.StringUtil');


/**
 * Contains API for various string operations.
 */
gva.util.StringUtil = (function() {

    return {

        /**
         * Returns the slugified version of a string (e.g 'Page Title' becomes 'page-title').
         * @param {string} str The string to slugify.
         * @return {string} The slugified string.
         */
        slugify: function(str) {

            // Strip extra space
            str = str.replace(/^\s|\s$/g, '');

            // Remove punctuation
            str = str.replace(/[^\w|\s]/g, '');

            // Replace spaces with hyphens
            str = str.replace(/\s+/g, '-');

            return str.toLowerCase();
        },

        /**
         * Removes any <...> tags in a string.
         * @param {string} str The string to strip.
         * @return {string} The stripped string.
         */
        stripTags: function(str) {
          return str.replace(/(<([^>]+)>)/ig, '');
        },


        /**
         * Truncates the string down to a single sentence if a period is detected after the minLength.
         * @param {string} str The string to truncate to a single sentence.
         * @param {number} minLength The minimum number of characters allowed before allowing a shortening.
         * @return {string} The shortened string or the original unchanged if it didn't pass the length checks.
         */
        singleSentence: function(str, minLength, maxLength) {

          if (str.indexOf('.') > (minLength - 1)) {
            str = str.substr(0, str.indexOf('.') + 1);
          }

          if (maxLength) {
            if (str.length > maxLength) {
              str = str.substr(0, maxLength);
              str = str.substr(0, str.lastIndexOf(' '));
              str += '...';
            }
          }

          return str;
        },

        /**
         * Computes the Levenshtein distance between 2 strings
         * @param {string} a The first string to compare.
         * @param {string} b The second string to compare.
         * @return {number} The Levenshtein distance between the 2 strings.
         */
        levenshtein: function(a, b) {
            var x = a.length, y = b.length;
            var i, j, d = [];
            for (i = 0; i <= x; i++) {
                d[i] = [];
                d[i][0] = i;
            }
            for (i = 0; i <= y; i++) {
                d[0][i] = i;
            }
            for (i = 1; i <= x; i++) {
              for (j = 1; j <= y; j++) {
                  d[i][j] = Math.min(
                      d[i - 1][j] + 1,
                      d[i][j - 1] + 1,
                      d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
                  );
              }
            }
            return d[x][y];
        }
    };

})();
