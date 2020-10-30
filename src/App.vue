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
            <svg ma-0></svg>
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
      shardSize: 3,
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
          d3.select("svg")
            .selectAll("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y);

          d3.select("svg")
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

      for (let node of self.nodesArray) {
        let distances = [];
        for (let other of self.nodesArray) {
          if (node.ip !== other.ip) {
            distances.push([other.ip, node.index ^ other.index]);
          }
        }
        distances.sort((a, b) => (a[1] > b[1] ? 1 : -1));
        for (let i = 1; i <= distances.length; i *= 2) {
          let link = { source: node.ip, target: distances[i - 1][0] };
          if (!isPresent(link)) {
            self.linksArray.push(link);
          }
        }
      }

      self.update();
    },
    update: function () {
      let self = this;

      // Updating the nodes.
      d3.select("svg")
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
          }
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", Constants.LOWLIGHT_OPACITY);
          if (!self.mouseClicked) {
            d3.selectAll("#node-info-card p").remove();
          }
        });

      // Updating the links.
      d3.select("svg")
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
                .duration(2000)
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
    distribute: function () {
      if (this.linksArray.length === 0) {
        this.establishConnections();
      }
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
  height: 30%;
}
#slider-container {
  text-align: center;
  width: 50%;
}
</style>