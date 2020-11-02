<template>
  <v-app>
    <v-container id="main-container">
      <v-container id="buttons-container">
        <v-btn
          :color="addButtonEnabled ? 'primary' : 'normal'"
          class="mx-5 elevation-0"
          @click="toggleButton('addButton')"
        >
          Add Nodes
        </v-btn>
        <v-btn
          :color="removeButtonEnabled ? 'info' : 'normal'"
          class="mx-5 elevation-0"
          @click="toggleButton('removeButton')"
        >
          Remove Nodes
        </v-btn>
        <v-btn
          class="mx-5"
          color="primary"
          outlined
          @click="establishConnections()"
        >
          Establish connections
        </v-btn>
      </v-container>

      <v-container id="slider-container">
        <v-row>
          <v-slider
            label="File Size (GB)"
            v-model="fileSize"
            min="1"
            max="100"
            thumb-label
            :thumb-color="sliderData.thumbColor"
          ></v-slider>
          <v-spacer></v-spacer>
          <v-btn outlined color="success" @click="distribute()">
            Distribute
          </v-btn>
        </v-row>
      </v-container>

      <v-row>
        <v-col cols="10">
          <v-container id="simulation-container" pa-0>
            <svg ma-0>
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
Strategies for transferring data.
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
  1. Add custom icons to cursors.
  2. Add a restart button.
  3. Optimize and refactor.
  4. Create vars for delays and intervals.
  5. After 3, add a slider to be able to adjust simulation speed.
  6. Add Data received as a bound variable that updates automatically.(Maybe
    even display it in the node circle)
  7. Improve the UI.
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
      fileSize: 10,
      sliderData: {
        thumbColor: Constants.SLIDER_THUMB_COLOR,
      },
      addButtonEnabled: true,
      removeButtonEnabled: false,
      nodesArray: [
        {
          ip: faker.internet.ip(),
          isBootNode: true,
          x: Constants.WIDTH / 2,
          y: Constants.HEIGHT / 2,
          data: [],
        },
      ],
      linksArray: [],
      mouseClicked: false,
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
            .attr("cy", (d) => d.y);

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
      if (buttonName === "addButton") {
        this.addButtonEnabled = true;
        this.removeButtonEnabled = !this.addButtonEnabled;
      } else if (buttonName === "removeButton") {
        this.removeButtonEnabled = true;
        this.addButtonEnabled = !this.removeButtonEnabled;
      }
    },
    addNode: function (event) {
      if (this.mouseClicked && this.addButtonEnabled) {
        this.linksArray = [];
        this.nodesArray.push({
          ip: faker.internet.ip(),
          x: d3.pointer(event)[0],
          y: d3.pointer(event)[1],
          isBootNode: false,
          data: [],
        });

        this.update();
      }
    },
    removeNodes: function (event) {
      if (this.mouseClicked && this.removeButtonEnabled) {
        this.linksArray = [];
        this.nodesArray = this.nodesArray.filter((n) => {
          let x1 = d3.pointer(event)[0],
            y1 = d3.pointer(event)[1],
            x2 = n.x,
            y2 = n.y;
          let distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          return n.isBootNode || distance > Constants.NODE_RADIUS * 1.75;
        });

        this.update();
      }
    },
    establishConnections: function () {
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

      // Updating the nodes.
      d3.select(".nodes")
        .selectAll("circle")
        .data(self.nodesArray, (d) => d.ip)
        .join((enter) =>
          enter
            .append("circle")
            .attr("r", Constants.NODE_RADIUS)
            .attr("fill", (d) =>
              d.isBootNode
                ? Constants.BOOT_NODE_COLOR
                : Constants.PEER_NODE_COLOR
            )
            .call((enter) =>
              enter
                .transition()
                .duration(400)
                .attr("opacity", Constants.LOWLIGHT_OPACITY)
            )
        )
        .on("mouseenter", function (_, node) {
          d3.select(this).attr("opacity", 1);
          if (!self.mouseClicked) {
            d3.select("#node-info-card").append("p").text(`IP: ${node.ip}`);
            d3.select("#node-info-card")
              .append("p")
              .text(`Type: ${node.isBootNode ? "Boot Node" : "Peer Node"}`);
            d3.select("#node-info-card")
              .append("p")
              .text(
                `Data: ${((node.data.length / noOfShards) * 100).toFixed(2)}%`
              );
          }
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", Constants.LOWLIGHT_OPACITY);
          if (!self.mouseClicked) {
            d3.selectAll("#node-info-card p").remove();
          }
        })
        .on("updateNodeColor", function (event, node) {
          let dataReceived = node.data.length / noOfShards;
          let originalColor = node.isBootNode
            ? Constants.BOOT_NODE_COLOR
            : Constants.PEER_NODE_COLOR;
          let colorScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([originalColor, Constants.FINAL_COLOR]);

          d3.select(this)
            .transition()
            .duration(500)
            .attr("opacity", dataReceived < 1 && dataReceived !== 0 ? 0.5 : 1)
            .transition()
            .duration(500)
            .attr("opacity", 1)
            .attr("fill", colorScale(dataReceived));
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
                .duration(400)
                .attr("opacity", Constants.LOWLIGHT_OPACITY * 0.3)
                .transition()
                .duration(1000)
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
        .style("border", "1px solid grey")
        .style("border-radius", "10px")
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
    distribute: async function () {
      let self = this;

      if (self.linksArray.length === 0) {
        self.establishConnections();
      }

      let getNodeIndFromIp = function (ip) {
        for (let i = 0; i < self.nodesArray.length; i++) {
          if (self.nodesArray[i].ip === ip) {
            return i;
          }
        }
      };

      // Creating data array formed by sharding the file.
      let dataArray = [];
      let noOfShards = Math.ceil(self.fileSize / Constants.SHARD_SIZE);
      for (let i = 1; i <= noOfShards; i++) {
        dataArray.push(`shard_${i}`);
      }

      // Transferring all the data to the boot node.
      for (let node of self.nodesArray) {
        if (node.isBootNode) {
          node.data = dataArray;
          break;
        }
      }
      d3.selectAll("circle").dispatch("updateNodeColor");

      // Timeout so that peer node updates wait for boot node color
      // update to finish.
      d3.timeout(function () {
        let t = d3.interval(function () {
          let isIncomplete = false;
          for (let node of self.nodesArray) {
            if (node.data.length < noOfShards) {
              isIncomplete = true;
            }
          }
          if (!isIncomplete) {
            t.stop();
          }

          for (let link of self.linksArray) {
            let sourceInd = getNodeIndFromIp(link.source.ip),
              targetInd = getNodeIndFromIp(link.target.ip);

            // Transferring from source to target.
            let lmt = link.limit;
            for (let shard of self.nodesArray[sourceInd].data) {
              if (self.nodesArray[targetInd].data.length + 1 > noOfShards) {
                break;
              }
              if (!self.nodesArray[targetInd].data.includes(shard)) {
                self.nodesArray[targetInd].data.push(shard);

                lmt--;
                if (lmt < 0) {
                  break;
                }
              }
            }

            // Transferring from target to source.
            lmt = link.limit;
            for (let shard of self.nodesArray[targetInd].data) {
              if (self.nodesArray[sourceInd].data.length + 1 > noOfShards) {
                break;
              }
              if (!self.nodesArray[sourceInd].data.includes(shard)) {
                self.nodesArray[sourceInd].data.push(shard);

                lmt--;
                if (lmt < 0) {
                  break;
                }
              }
            }

            d3.selectAll("circle").dispatch("updateNodeColor");
          }
        }, 800);
      }, 500);
    },
  },
};
</script>

<style>
#main-container {
  text-align: center;
}
#node-info-card {
  border: 2px solid lightgray;
  text-align: center;
  height: fit-content;
  min-height: 40%;
}
#slider-container {
  text-align: center;
  width: 50%;
}
</style>