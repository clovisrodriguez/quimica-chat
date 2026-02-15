import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = () => {};

// jsdom doesn't implement SVG methods used by MoleculeBuilder
// Polyfill createSVGPoint and getScreenCTM so svgPoint() works as identity transform
if (typeof SVGElement !== 'undefined') {
  SVGElement.prototype.createSVGPoint = function () {
    return {
      x: 0,
      y: 0,
      matrixTransform(matrix) {
        return { x: this.x, y: this.y };
      },
    };
  };
  SVGElement.prototype.getScreenCTM = function () {
    return {
      inverse() {
        return {};
      },
    };
  };
}
