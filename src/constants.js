import $ from "jquery";

const WIDTH = $(document).width() * 0.7;
const HEIGHT = $(document).height() * 0.7;
const NODE_RADIUS = 10;
const SLIDER_THUMB_COLOR = "grey darken-2";
const BOOT_NODE_COLOR = "greenyellow";
const PEER_NODE_COLOR = "cornflowerblue";
const LINK_COLOR = "cornflowerblue";
const LOWLIGHT_OPACITY = 1;

export default {
  WIDTH: WIDTH,
  HEIGHT: HEIGHT,
  NODE_RADIUS: NODE_RADIUS,
  SLIDER_THUMB_COLOR: SLIDER_THUMB_COLOR,
  BOOT_NODE_COLOR: BOOT_NODE_COLOR,
  PEER_NODE_COLOR: PEER_NODE_COLOR,
  LINK_COLOR: LINK_COLOR,
  LOWLIGHT_OPACITY: LOWLIGHT_OPACITY,
};
