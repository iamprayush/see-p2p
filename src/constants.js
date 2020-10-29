import $ from "jquery";

const WIDTH = $(document).width() * 0.7;
const HEIGHT = $(document).height() * 0.7;
const NODE_RADIUS = 15;
const BOOT_NODE_COLOR = "greenyellow";
const PEER_NODE_COLOR = "cornflowerblue";
const LOWLIGHT_OPACITY = 0.55;

export default {
  WIDTH: WIDTH,
  HEIGHT: HEIGHT,
  NODE_RADIUS: NODE_RADIUS,
  BOOT_NODE_COLOR: BOOT_NODE_COLOR,
  PEER_NODE_COLOR: PEER_NODE_COLOR,
  LOWLIGHT_OPACITY: LOWLIGHT_OPACITY,
};
