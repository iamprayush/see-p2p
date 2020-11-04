import $ from "jquery";

const WIDTH = $(document).width() * 0.7;
const HEIGHT = $(document).height() * 0.6;

const NODE_RADIUS = 18;
const REMOVE_ICON_RADIUS = 42.5;

const SLIDER_THUMB_COLOR = "grey darken-2";
const BOOT_NODE_COLOR = "#545454";
const PEER_NODE_COLOR = "cornflowerblue";
const FINAL_COLOR = "#4CAF50";
const LINK_COLOR = "#545454";

// Unit: GB
const SHARD_SIZE = 0.5;
const INITIAL_FILE_SIZE = 10;

const ADD_CURSOR = `url(${require("@/assets/addIcon.svg")}) 17.5 17.5, default`;
const REMOVE_CURSOR = `url(${require("@/assets/removeIcon.svg")}) ${REMOVE_ICON_RADIUS} ${REMOVE_ICON_RADIUS}, default`;

// Transition durations (milliseconds)
const DUR_NODE_APPEAR = 400;
const DUR_NODE_BLINK = 1000;
const DUR_LINK_APPEAR = 400;
const DUR_DELAY = 200;

export default {
  WIDTH: WIDTH,
  HEIGHT: HEIGHT,
  NODE_RADIUS: NODE_RADIUS,
  REMOVE_ICON_RADIUS: REMOVE_ICON_RADIUS,
  SLIDER_THUMB_COLOR: SLIDER_THUMB_COLOR,
  BOOT_NODE_COLOR: BOOT_NODE_COLOR,
  PEER_NODE_COLOR: PEER_NODE_COLOR,
  FINAL_COLOR: FINAL_COLOR,
  LINK_COLOR: LINK_COLOR,
  SHARD_SIZE: SHARD_SIZE,
  INITIAL_FILE_SIZE: INITIAL_FILE_SIZE,
  ADD_CURSOR: ADD_CURSOR,
  REMOVE_CURSOR: REMOVE_CURSOR,
  DUR_NODE_APPEAR: DUR_NODE_APPEAR,
  DUR_NODE_BLINK: DUR_NODE_BLINK,
  DUR_LINK_APPEAR: DUR_LINK_APPEAR,
  DUR_DELAY: DUR_DELAY,
};
