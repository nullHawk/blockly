/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An object that owns a block's rendering SVG elements.
 *
 * @class
 */
import * as goog from '../../../closure/goog/goog.js';
goog.declareModuleId('Blockly.blockRendering.PathObject');

import type {BlockSvg} from '../../block_svg.js';
import type {Connection} from '../../connection.js';
import type {BlockStyle} from '../../theme.js';
import * as dom from '../../utils/dom.js';
import {Svg} from '../../utils/svg.js';

import type {ConstantProvider} from './constants.js';
import type {IPathObject} from './i_path_object.js';


/**
 * An object that handles creating and setting each of the SVG elements
 * used by the renderer.
 *
 * @alias Blockly.blockRendering.PathObject
 */
export class PathObject implements IPathObject {
  svgRoot: SVGElement;
  /** @internal */
  svgPath: SVGElement;

  /**
   * Holds the cursors svg element when the cursor is attached to the block.
   * This is null if there is no cursor on the block.
   *
   * @internal
   */
  cursorSvg: SVGElement|null = null;

  /**
   * Holds the markers svg element when the marker is attached to the block.
   * This is null if there is no marker on the block.
   *
   * @internal
   */
  markerSvg: SVGElement|null = null;

  /** @internal */
  constants: ConstantProvider;
  /** @internal */
  style: BlockStyle;

  /**
   * @param root The root SVG element.
   * @param style The style object to use for colouring.
   * @param constants The renderer's constants.
   * @internal
   */
  constructor(
      root: SVGElement, style: BlockStyle, constants: ConstantProvider) {
    this.constants = constants;
    this.style = style;
    this.svgRoot = root;

    /** The primary path of the block. */
    this.svgPath =
        dom.createSvgElement(Svg.PATH, {'class': 'blocklyPath'}, this.svgRoot);
  }

  /**
   * Set the path generated by the renderer onto the respective SVG element.
   *
   * @param pathString The path.
   * @internal
   */
  setPath(pathString: string) {
    this.svgPath.setAttribute('d', pathString);
  }

  /**
   * Flip the SVG paths in RTL.
   *
   * @internal
   */
  flipRTL() {
    // Mirror the block's path.
    this.svgPath.setAttribute('transform', 'scale(-1 1)');
  }

  /**
   * Add the cursor SVG to this block's SVG group.
   *
   * @param cursorSvg The SVG root of the cursor to be added to the block SVG
   *     group.
   * @internal
   */
  setCursorSvg(cursorSvg: SVGElement) {
    if (!cursorSvg) {
      this.cursorSvg = null;
      return;
    }

    this.svgRoot.appendChild(cursorSvg);
    this.cursorSvg = cursorSvg;
  }

  /**
   * Add the marker SVG to this block's SVG group.
   *
   * @param markerSvg The SVG root of the marker to be added to the block SVG
   *     group.
   * @internal
   */
  setMarkerSvg(markerSvg: SVGElement) {
    if (!markerSvg) {
      this.markerSvg = null;
      return;
    }

    if (this.cursorSvg) {
      this.svgRoot.insertBefore(markerSvg, this.cursorSvg);
    } else {
      this.svgRoot.appendChild(markerSvg);
    }
    this.markerSvg = markerSvg;
  }

  /**
   * Apply the stored colours to the block's path, taking into account whether
   * the paths belong to a shadow block.
   *
   * @param block The source block.
   * @internal
   */
  applyColour(block: BlockSvg) {
    if (!this.style.colourTertiary) {
      throw new Error(
          'The renderer did not properly initialize the block style');
    }
    this.svgPath.setAttribute('stroke', this.style.colourTertiary);
    this.svgPath.setAttribute('fill', this.style.colourPrimary);

    this.updateShadow_(block.isShadow());
    this.updateDisabled_(!block.isEnabled() || block.getInheritedDisabled());
  }

  /**
   * Set the style.
   *
   * @param blockStyle The block style to use.
   * @internal
   */
  setStyle(blockStyle: BlockStyle) {
    this.style = blockStyle;
  }

  /**
   * Add or remove the given CSS class on the path object's root SVG element.
   *
   * @param className The name of the class to add or remove
   * @param add True if the class should be added.  False if it should be
   *     removed.
   */
  protected setClass_(className: string, add: boolean) {
    if (!className) {
      return;
    }
    if (add) {
      this.svgRoot.classList.add(className);
    } else {
      this.svgRoot.classList.remove(className);
    }
  }

  /**
   * Set whether the block shows a highlight or not.  Block highlighting is
   * often used to visually mark blocks currently being executed.
   *
   * @param enable True if highlighted.
   * @internal
   */
  updateHighlighted(enable: boolean) {
    if (enable) {
      this.svgPath.setAttribute(
          'filter', 'url(#' + this.constants.embossFilterId + ')');
    } else {
      this.svgPath.setAttribute('filter', 'none');
    }
  }

  /**
   * Updates the look of the block to reflect a shadow state.
   *
   * @param shadow True if the block is a shadow block.
   */
  protected updateShadow_(shadow: boolean) {
    if (shadow) {
      if (!this.style.colourSecondary) {
        throw new Error(
            'The renderer did not properly initialize the block style');
      }
      this.svgPath.setAttribute('stroke', 'none');
      this.svgPath.setAttribute('fill', this.style.colourSecondary);
    }
  }

  /**
   * Updates the look of the block to reflect a disabled state.
   *
   * @param disabled True if disabled.
   */
  protected updateDisabled_(disabled: boolean) {
    this.setClass_('blocklyDisabled', disabled);
    if (disabled) {
      this.svgPath.setAttribute(
          'fill', 'url(#' + this.constants.disabledPatternId + ')');
    }
  }

  /**
   * Add or remove styling showing that a block is selected.
   *
   * @param enable True if selection is enabled, false otherwise.
   * @internal
   */
  updateSelected(enable: boolean) {
    this.setClass_('blocklySelected', enable);
  }

  /**
   * Add or remove styling showing that a block is dragged over a delete area.
   *
   * @param enable True if the block is being dragged over a delete area, false
   *     otherwise.
   * @internal
   */
  updateDraggingDelete(enable: boolean) {
    this.setClass_('blocklyDraggingDelete', enable);
  }

  /**
   * Add or remove styling showing that a block is an insertion marker.
   *
   * @param enable True if the block is an insertion marker, false otherwise.
   * @internal
   */
  updateInsertionMarker(enable: boolean) {
    this.setClass_('blocklyInsertionMarker', enable);
  }

  /**
   * Add or remove styling showing that a block is movable.
   *
   * @param enable True if the block is movable, false otherwise.
   * @internal
   */
  updateMovable(enable: boolean) {
    this.setClass_('blocklyDraggable', enable);
  }

  /**
   * Add or remove styling that shows that if the dragging block is dropped,
   * this block will be replaced.  If a shadow block, it will disappear.
   * Otherwise it will bump.
   *
   * @param enable True if styling should be added.
   * @internal
   */
  updateReplacementFade(enable: boolean) {
    this.setClass_('blocklyReplaceable', enable);
  }

  /**
   * Add or remove styling that shows that if the dragging block is dropped,
   * this block will be connected to the input.
   *
   * @param _conn The connection on the input to highlight.
   * @param _enable True if styling should be added.
   * @internal
   */
  updateShapeForInputHighlight(_conn: Connection, _enable: boolean) {
    // NOOP
  }
}
