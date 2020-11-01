import $ from "jquery";

const WIDTH = $(document).width() * 0.7;
const HEIGHT = $(document).height() * 0.7;
const NODE_RADIUS = 18;
const SLIDER_THUMB_COLOR = "grey darken-2";
const BOOT_NODE_COLOR = "grey";
const PEER_NODE_COLOR = "cornflowerblue";
const FINAL_COLOR = "greenyellow";
const LINK_COLOR = "grey";
const LOWLIGHT_OPACITY = 1;
const SHARD_SIZE = 0.5; // Unit: GB

export default {
  WIDTH: WIDTH,
  HEIGHT: HEIGHT,
  NODE_RADIUS: NODE_RADIUS,
  SLIDER_THUMB_COLOR: SLIDER_THUMB_COLOR,
  BOOT_NODE_COLOR: BOOT_NODE_COLOR,
  PEER_NODE_COLOR: PEER_NODE_COLOR,
  FINAL_COLOR: FINAL_COLOR,
  LINK_COLOR: LINK_COLOR,
  LOWLIGHT_OPACITY: LOWLIGHT_OPACITY,
  SHARD_SIZE: SHARD_SIZE,
};
