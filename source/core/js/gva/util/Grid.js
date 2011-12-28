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
goog.provide('gva.util.Grid');

/**
 * Creates a new Grid instance.
 * @constructor
 */
gva.util.Grid = function() {

    /**
     * The number of rows along the y axis of the grid.
     * @type {number}
     */
    this.rows = 0;

    /**
     * The number of columns along the x axis of the grid.
     * @type {number}
     */
    this.cols = 0;

    /**
     * The total number of cells available in the grid
     * @type {number}
     */
    this.cells = 0;

    /**
     * An array of 2D points representing the top left position of each grid cell.
     * @type {Array.<Object>}
     */
    this.coords = [];

    /**
     * Whether columns should be positioned in the center of the available width
     * @type {Boolean}
     */
    this.centerAlignX = true;

    /**
     * Whether rows should be positioned in the center of the available height
     * @type {Boolean}
     */
    this.centerAlignY = true;

    /**
     * The outer boundaries of the grid
     * @type {Object}
     */
    this.gridBounds = {

            x: 1.0,
            y: 1.0,
            width: 1.0,
            height: 1.0
    };

    /**
     * The outer boundaries of each grid cell
     * @type {Object}
     */
    this.cellBounds = {

            width: 1.0,
            height: 1.0,
            spacingX: 1.0,
            spacingY: 1.0
    };
};
goog.inherits(gva.util.Grid, goog.events.EventTarget);

/**
 * Sets the outer boundaries of the grid and automatically recalculates the cell positions.
 * @param {number} x The position of the grid on the x axis.
 * @param {number} y The position of the grid on the y axis.
 * @param {number} width The total width of the grid.
 * @param {number} height The total height of the grid.
 */
gva.util.Grid.prototype.setGridBounds = function(x, y, width, height) {
    this.gridBounds.x = isNaN(x) ? 1.0 : parseFloat(x);
    this.gridBounds.y = isNaN(y) ? 1.0 : parseFloat(y);
    this.gridBounds.width = isNaN(width) ? 1.0 : parseFloat(width);
    this.gridBounds.height = isNaN(height) ? 1.0 : parseFloat(height);
    this.refresh();
};

/**
 * Sets the outer boundaries of each grid cell and automatically recalculates the cell positions.
 * @param {number} width The width of each grid cell.
 * @param {number} height The height of each grid cell.
 * @param {number} spacingX The spacing between grid cells along the x axis.
 * @param {number} spacingY The spacing between grid cells along the y axis.
 */
gva.util.Grid.prototype.setCellBounds = function(width, height, spacingX, spacingY) {
    this.cellBounds.width = isNaN(width) ? 1.0 : parseFloat(width);
    this.cellBounds.height = isNaN(height) ? 1.0 : parseFloat(height);
    this.cellBounds.spacingX = isNaN(spacingX) ? 1.0 : parseFloat(spacingX);
    this.cellBounds.spacingY = isNaN(spacingY) ? 1.0 : parseFloat(spacingY);
    this.refresh();
};

/**
 * Recalculates each cell position based on the current grid setup
 */
gva.util.Grid.prototype.refresh = function() {

    // Store the total with and height of each cell, including spacing
    var stepX = this.cellBounds.width + this.cellBounds.spacingX;
    var stepY = this.cellBounds.height + this.cellBounds.spacingY;

    // Compute the maximum possible number of cells in each direction
    this.cols = Math.floor((this.gridBounds.width - this.cellBounds.spacingX) / stepX);
    this.rows = Math.floor((this.gridBounds.height - this.cellBounds.spacingY) / stepY);

    // Compute the remaining space after accommodating the cells
    var spaceX = (this.gridBounds.width - this.cellBounds.spacingX) - (this.cols * stepX);
    var spaceY = (this.gridBounds.height - this.cellBounds.spacingY) - (this.rows * stepY);

    // Offset by half the remaining space
    var startX = this.centerAlignX ? this.cellBounds.spacingX + spaceX * 0.5 : 0.0;
    var startY = this.centerAlignY ? this.cellBounds.spacingY + spaceY * 0.5 : 0.0;

    // Calculate coordinates from dimensions
    this.coords = [];

    var row, col;

    for (row = 0; row < this.rows; row++) {
        for (col = 0; col < this.cols; col++) {
            this.coords.push({
                x: startX + (col * stepX),
                y: startY + (row * stepY)
            });
        }
    }

    // Update the total amount of visible cells
    this.cells = this.rows * this.cols;
};
