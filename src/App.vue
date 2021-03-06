<template>
  <v-app>
    <v-container id="main-container">
      <v-img
        id="logo"
        :src="require('./assets/seep2p_logo_white.svg')"
        height="200"
        width="200"
      />

      <v-container class="buttons-container">
        <v-btn
          :color="toggleButtons.moveButtonEnabled ? 'primary' : 'normal'"
          class="mx-5 elevation-0"
          @click="toggleButton('moveButton')"
        >
          Move Nodes
        </v-btn>
        <v-btn
          :color="toggleButtons.addButtonEnabled ? 'primary' : 'normal'"
          class="mx-5 elevation-0"
          @click="toggleButton('addButton')"
        >
          Add Nodes
        </v-btn>
        <v-btn
          :color="toggleButtons.removeButtonEnabled ? 'primary' : 'normal'"
          class="mx-5 elevation-0"
          @click="toggleButton('removeButton')"
        >
          Remove Nodes
        </v-btn>
      </v-container>

      <v-container class="buttons-container">
        <v-btn
          class="mx-5"
          color="primary"
          outlined
          @click="establishConnections()"
        >
          Establish connections
        </v-btn>
        <v-btn class="mx-5" outlined color="success" @click="distribute()">
          Distribute
        </v-btn>
        <v-btn class="mx-5" outlined color="warning" @click="reset()">
          Reset
        </v-btn>
      </v-container>

      <v-container id="slider-container">
        <v-row>
          <v-btn
            fab
            elevation="1"
            x-small
            @click="simulationSpeed = Math.max(1, simulationSpeed - 1)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          <h3 class="mt-1 mx-3 sim-speed-text">{{ simulationSpeed }}x</h3>
          <v-btn
            fab
            elevation="1"
            x-small
            @click="simulationSpeed = Math.min(10, simulationSpeed + 1)"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>

          <v-slider
            class="mx-10"
            label="File Size (GB)"
            v-model="fileSize"
            min="1"
            max="100"
            thumb-label
            :thumb-color="sliderData.thumbColor"
            @change="onFileSizeChange"
          ></v-slider>
        </v-row>
      </v-container>

      <v-row>
        <v-col cols="10">
          <v-container id="simulation-container" pa-0>
            <svg ma-0 :style="{ cursor: cursorImage }">
              <g class="links"></g>
              <g class="nodes"></g>
            </svg>
          </v-container>
        </v-col>
        <v-col>
          <v-card id="node-info-card" class="mb-7">
            <h3>NODE INFO</h3>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
/*
Strategies for transferring distribution.
While (not all nodes have all the data) {
  Strategy 1. 
  For each node {
    See if any of the neighbors have a shard that you dont,
    if so, transfer it.
  }

  Strategy 2.
  For each link {
    See if one node has something the other one doesn't, if so, transfer
    it, and then see if the other one has something that this one
    doesn't and if so, transfer it.
  }

  I think strategy 2 will be better since we can keep a track of the
  amount of files transferred via a single channel, so that we can
  limit/extend it based on the throughput of the network.
}
*/

/* TODOS:
  (DONE!) 1. Add custom icons to cursors.
  (DONE!) 2. Add a restart button.
  (DONE!) 3. Create vars for delays and intervals.
  (DONE!) 4. After 3, add a slider to be able to adjust simulation speed.
  (DONE!) 5. Optimize and refactor.
  (DONE!) 6. Add functionality to move nodes.
  (DONE!) 7. Add Data received as a bound variable that updates automatically.
    (Maybe even display it in the node circle)
  8. Improve the UI.
  9. Add functionality to pause the simulation.
  10. Add functionality to speed up the simulation while running.
  11. Add warning sign if simulation will be too computationally heavy.
*/

import * as d3 from "d3";
import faker from "faker";
import Constants from "./constants.js";

export default {
  name: "App",
  mounted: function () {
    this.initialize();
  },
  data: function () {
    return {
      cursorImage: "default",
      fileSize: Constants.INITIAL_FILE_SIZE,
      sliderData: {
        thumbColor: Constants.SLIDER_THUMB_COLOR,
      },
      toggleButtons: {
        moveButtonEnabled: true,
        addButtonEnabled: false,
        removeButtonEnabled: false,
      },
      nodesArray: [
        {
          ip: faker.internet.ip(),
          isBootNode: true,
          x: Constants.WIDTH / 2,
          y: Constants.HEIGHT / 2,
          data: new Set(),
        },
      ],
      linksArray: [],
      completedNodes: new Set(), // Nodes that have all the data.
      mouseClicked: false,
      simulationSpeed: 1,
      distributionTimer: null,
      simulation: d3
        .forceSimulation()
        .force("x", d3.forceX(Constants.WIDTH / 2))
        .force("y", d3.forceY(Constants.HEIGHT / 2))
        .force("collide", d3.forceCollide(Constants.NODE_RADIUS * 2.5))
        .force(
          "link",
          d3
            .forceLink()
            .id((d) => d.ip)
            .strength(0.15)
        )
        .on("tick", () => {
          d3.select(".nodes")
            .selectAll("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .call(this.drag());

          d3.select(".nodes")
            .selectAll("text")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y + 6)
            .attr("text-anchor", "middle")
            .call(this.drag());

          d3.select(".links")
            .selectAll("line")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);
        }),
    };
  },
  methods: {
    toggleButton: function (buttonName) {
      if (buttonName === "moveButton") {
        this.toggleButtons.moveButtonEnabled = true;
        this.toggleButtons.addButtonEnabled = false;
        this.toggleButtons.removeButtonEnabled = false;
      } else if (buttonName === "addButton") {
        this.toggleButtons.moveButtonEnabled = false;
        this.toggleButtons.addButtonEnabled = true;
        this.toggleButtons.removeButtonEnabled = false;
      } else if (buttonName === "removeButton") {
        this.toggleButtons.moveButtonEnabled = false;
        this.toggleButtons.addButtonEnabled = false;
        this.toggleButtons.removeButtonEnabled = true;
      }
      this.cursorImage = this.getCurrentCursor();
    },
    getCurrentCursor: function () {
      if (this.toggleButtons.moveButtonEnabled) return "default";
      if (this.toggleButtons.addButtonEnabled) return Constants.ADD_CURSOR;
      return Constants.REMOVE_CURSOR;
    },
    addNode: function (event) {
      if (this.mouseClicked && this.toggleButtons.addButtonEnabled) {
        this.linksArray = [];
        this.nodesArray.push({
          ip: faker.internet.ip(),
          x: d3.pointer(event)[0],
          y: d3.pointer(event)[1],
          isBootNode: false,
          data: new Set(),
        });

        this.update();
      }
    },
    removeNodes: function (event) {
      if (this.mouseClicked && this.toggleButtons.removeButtonEnabled) {
        this.linksArray = [];
        this.nodesArray = this.nodesArray.filter((n) => {
          let x1 = d3.pointer(event)[0],
            y1 = d3.pointer(event)[1],
            x2 = n.x,
            y2 = n.y;
          let distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          return (
            n.isBootNode ||
            distance > Constants.NODE_RADIUS + Constants.REMOVE_ICON_RADIUS
          );
        });

        this.update();
      }
    },
    establishConnections: function () {
      // Establishes connections based on XOR distance metric.
      // More info: https://en.wikipedia.org/wiki/Kademlia
      // Every peer will be connected to log(n) peers. For each peer, it will be
      // connected to the peer at a distance of 1, 2, 4, 8, ... and so on.
      // According to Kademlia, the distance between two nodes will be measured
      // by XORing their IDs, which in this case is their indices. We could also
      // XOR the hash of their IP addresses.

      let self = this;
      self.linksArray = [];

      let isPresent = function (link) {
        let sourceTarget = [link.source, link.target].sort();
        for (let otherLink of self.linksArray) {
          let otherSourceTarget = [otherLink.source, otherLink.target].sort();
          if (
            sourceTarget[0] === otherSourceTarget[0] &&
            sourceTarget[1] === otherSourceTarget[1]
          ) {
            return true;
          }
        }
        return false;
      };

      let getRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      for (let node of self.nodesArray) {
        let distances = [];
        for (let other of self.nodesArray) {
          if (node.ip !== other.ip) {
            distances.push([other.ip, node.index ^ other.index]);
          }
        }
        distances.sort((a, b) => (a[1] > b[1] ? 1 : -1));
        for (let i = 1; i <= distances.length; i *= 2) {
          let link = {
            source: node.ip,
            target: distances[i - 1][0],
            limit: getRandomInt(1, 10),
          };
          if (!isPresent(link)) {
            self.linksArray.push(link);
          }
        }
      }

      self.update();
    },
    update: function () {
      let self = this;

      let noOfShards = Math.ceil(self.fileSize / Constants.SHARD_SIZE);

      let onMouseEnter = function (event, node) {
        if (!self.mouseClicked) {
          self.cursorImage = self.toggleButtons.addButtonEnabled
            ? "default"
            : self.getCurrentCursor();
          d3.select("#node-info-card").append("p").text(`IP: ${node.ip}`);
          d3.select("#node-info-card")
            .append("p")
            .text(`Type: ${node.isBootNode ? "Boot Node" : "Peer Node"}`);
        }
      };

      let onMouseOut = function () {
        self.cursorImage = self.getCurrentCursor();
        if (!self.mouseClicked) {
          d3.selectAll("#node-info-card p").remove();
        }
      };

      // Updating the nodes.
      d3.select(".nodes")
        .selectAll("circle")
        .data(self.nodesArray, (d) => d.ip)
        .join((enter) =>
          enter.append("circle").call((enter) =>
            enter
              .transition()
              .duration(Constants.DUR_NODE_APPEAR)
              .attr("r", Constants.NODE_RADIUS)
              .attr("fill", (d) =>
                d.isBootNode
                  ? Constants.BOOT_NODE_COLOR
                  : Constants.PEER_NODE_COLOR
              )
              .attr("opacity", 1)
          )
        )
        .on("mouseenter", onMouseEnter)
        .on("mouseout", onMouseOut)
        .on("updateNodeColor", function (event, node) {
          let dataReceived = node.data.size / noOfShards;
          let originalColor = node.isBootNode
            ? Constants.BOOT_NODE_COLOR
            : Constants.PEER_NODE_COLOR;
          let colorScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([originalColor, Constants.FINAL_COLOR]);

          d3.select(this)
            .transition()
            .duration(Constants.DUR_NODE_BLINK / self.simulationSpeed / 2)
            .attr("opacity", dataReceived < 1 && dataReceived !== 0 ? 0.5 : 1)
            .transition()
            .duration(Constants.DUR_NODE_BLINK / self.simulationSpeed / 2)
            .attr("opacity", 1)
            .attr("fill", colorScale(dataReceived));
        });

      // Updating node texts.
      d3.select(".nodes")
        .selectAll("text")
        .data(self.nodesArray)
        .join((enter) =>
          enter
            .append("text")
            .call((enter) =>
              enter
                .transition()
                .duration(Constants.DUR_NODE_APPEAR)
                .attr("opacity", 1)
            )
        )
        .on("mouseenter", onMouseEnter)
        .on("mouseout", onMouseOut)
        .on("updateNodeText", function (event, node) {
          let dataReceived = Math.round((node.data.size / noOfShards) * 100);
          d3.select(this)
            .attr("opacity", dataReceived < 100 ? 0 : 1)
            .transition()
            .duration(Constants.DUR_NODE_BLINK)
            .attr("opacity", 1)
            .text(dataReceived);
        });

      // Updating the links.
      d3.select(".links")
        .selectAll("line")
        .data(self.linksArray, (d) => [d.source.ip, d.target.ip])
        .join((enter) => {
          enter
            .append("line")
            .attr("stroke", Constants.LINK_COLOR)
            .call((enter) =>
              enter
                .transition()
                .duration(Constants.DUR_LINK_APPEAR / self.simulationSpeed)
                .attr("opacity", 1)
            );
        });

      // Updating the force simulation.
      self.simulation.nodes(self.nodesArray);
      self.simulation.force("link").links(self.linksArray);
      self.simulation.alpha(0.15).restart();
    },
    initialize: function () {
      let self = this;

      // Initializing the SVG.
      d3.select("svg")
        .attr("width", Constants.WIDTH)
        .attr("height", Constants.HEIGHT)
        .on("mousemove", self.removeNodes)
        .on("mousedown", (event) => {
          self.mouseClicked = true;
          self.addNode(event);
        })
        .on("mouseup", () => {
          self.mouseClicked = false;
        });

      self.update();
    },
    distribute: function () {
      let self = this;

      if (self.linksArray.length === 0) {
        self.establishConnections();
      }

      // Creating data array formed by sharding the file.
      let dataArray = [];
      let noOfShards = Math.ceil(self.fileSize / Constants.SHARD_SIZE);
      for (let i = 1; i <= noOfShards; i++) {
        dataArray.push(`shard_${i}`);
      }

      // Transferring all the data to the boot node.
      self.nodesArray[0].data = new Set(dataArray);
      self.completedNodes.add(self.nodesArray[0].ip);
      d3.selectAll("circle").dispatch("updateNodeColor");
      d3.selectAll("text").dispatch("updateNodeText");

      d3.timeout(function () {
        self.distributionTimer = d3.interval(function () {
          if (self.completedNodes.size === self.nodesArray.length)
            self.distributionTimer.stop();

          for (let link of self.linksArray) {
            let sourceIndex = link.source.index,
              targetIndex = link.target.index;

            // Transferring from source to target.
            let linkLimit = link.limit;
            for (let shard of self.nodesArray[sourceIndex].data) {
              // If the target node already has all the data, then we break.
              if (self.nodesArray[targetIndex].data.size === noOfShards) {
                self.completedNodes.add(self.nodesArray[targetIndex].ip);
                break;
              }
              if (!self.nodesArray[targetIndex].data.has(shard)) {
                self.nodesArray[targetIndex].data.add(shard);

                linkLimit--;
                if (linkLimit < 0) {
                  break;
                }
              }
            }

            // Transferring from target to source.
            linkLimit = link.limit;
            for (let shard of self.nodesArray[targetIndex].data) {
              // If the target node already has all the data, then we break.
              if (self.nodesArray[sourceIndex].data.length === noOfShards) {
                self.completedNodes.add(self.nodesArray[sourceIndex].ip);
                break;
              }
              if (!self.nodesArray[sourceIndex].data.has(shard)) {
                self.nodesArray[sourceIndex].data.add(shard);

                linkLimit--;
                if (linkLimit < 0) {
                  break;
                }
              }
            }

            d3.selectAll("circle").dispatch("updateNodeColor");
            d3.selectAll("text").dispatch("updateNodeText");
          }
        }, (Constants.DUR_NODE_BLINK + Constants.DUR_DELAY) /
          self.simulationSpeed);
        // Wait for blink animation to finish before starting another cycle.
      }, (Math.max(Constants.DUR_NODE_BLINK, Constants.DUR_LINK_APPEAR) +
        Constants.DUR_DELAY) /
        self.simulationSpeed);
      // Wait for boot node color update and connection establishment to finish
      // before starting the first cycle.
    },
    reset: function () {
      // Stopping the distribution timer.
      if (this.distributionTimer !== null) this.distributionTimer.stop();

      // Removing all connections.
      this.linksArray = [];

      // Removing all nodes except the boot node.
      this.nodesArray = this.nodesArray.filter(function (node) {
        return node.isBootNode;
      });
      // Removing all of the data from the boot node.
      this.nodesArray[0].data.clear();

      this.completedNodes.clear();

      // Resetting file size slider and simulation speed counter.
      this.fileSize = Constants.INITIAL_FILE_SIZE;

      this.simulationSpeed = 1;

      this.update();
      d3.selectAll("circle").dispatch("updateNodeColor");
      d3.selectAll("text").dispatch("updateNodeText");
    },
    drag: function () {
      let self = this;

      let dragstarted = function (event) {
        if (!event.active) self.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      };

      let dragged = function (event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      };

      let dragended = function (event) {
        if (!event.active) self.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      };

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    },
    onFileSizeChange: function () {
      // Stopping the distribution timer.
      if (this.distributionTimer !== null) this.distributionTimer.stop();

      // Removing all of the data from the nodes.
      for (let node of this.nodesArray) {
        node.data.clear();
      }

      this.completedNodes.clear();

      this.update();
      d3.selectAll("circle").dispatch("updateNodeColor");
      d3.selectAll("text").dispatch("updateNodeText");
    },
  },
};
</script>

<style>
#main-container {
  text-align: center;
}
#logo {
  position: absolute;
  left: 5%;
  top: 0;
}
#node-info-card {
  border: 2px solid lightgray;
  text-align: center;
  height: fit-content;
  min-height: 30%;
}
#slider-container {
  text-align: center;
  width: 50%;
}
.sim-speed-text {
  font-weight: normal;
}
.nodes text {
  font-family: sans-serif;
  font-size: 18px;
  font-weight: bold;
  fill: white;

  /* To make the text unselectable. */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>