<template>
  <v-app>
    <v-container id="main-container">
      <v-container id="buttons-container">
        <v-btn
          :color="addButtonEnabled ? 'info' : 'normal'"
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
        <v-btn class="mx-5" color="success" outlined>
          Establish connections
        </v-btn>
      </v-container>
      <v-row>
        <v-col cols="10">
          <v-container id="simulation-container" pa-0>
            <svg ma-0></svg>
          </v-container>
        </v-col>
        <v-col>
          <v-card id="node-info-card">
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
    this.simulate();
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
    simulate: function () {
      let nodes = [
        {
          ip: faker.internet.ip(),
          isBootNode: true,
          x: Constants.WIDTH / 2,
          y: Constants.HEIGHT / 2,
        },
      ];
      let links = [];

      let checkAddButton = () => this.addButtonEnabled;
      let checkRemoveButton = () => this.removeButtonEnabled;

      let mouseClicked = false;

      let addNode = function (event) {
        if (mouseClicked && checkAddButton()) {
          nodes.push({
            ip: faker.internet.ip(),
            x: d3.pointer(event)[0],
            y: d3.pointer(event)[1],
            isBootNode: false,
          });

          update({ nodes, links });
        }
      };

      let removeNodes = function (event) {
        if (mouseClicked && checkRemoveButton()) {
          nodes = nodes.filter(function (n) {
            let x1 = d3.pointer(event)[0],
              y1 = d3.pointer(event)[1],
              x2 = n.x,
              y2 = n.y;
            let distance = Math.sqrt(
              Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
            );
            return n.isBootNode || distance > Constants.NODE_RADIUS * 1.75;
          });

          update({ nodes, links });
        }
      };

      let svg = d3
        .select("svg")
        .attr("width", Constants.WIDTH)
        .attr("height", Constants.HEIGHT)
        .style("border", "1px solid black")
        .on("mousemove", removeNodes)
        .on("mousedown", (event) => {
          mouseClicked = true;
          addNode(event);
        })
        .on("mouseup", () => {
          mouseClicked = false;
        });

      let link = svg.append("g").selectAll("line");

      let node = svg.append("g").selectAll("circle");

      let ticked = function () {
        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
      };

      const simulation = d3
        .forceSimulation()
        .force("x", d3.forceX(Constants.WIDTH / 2))
        .force("y", d3.forceY(Constants.HEIGHT / 2))
        .force("collide", d3.forceCollide(Constants.NODE_RADIUS * 2))
        .force(
          "link",
          d3.forceLink().id((d) => d.ip)
        )
        .on("tick", ticked);

      let update = function ({ nodes, links }) {
        node = node
          .data(nodes, (d) => d.ip)
          .join((enter) =>
            enter
              .append("circle")
              .attr("r", Constants.NODE_RADIUS)
              .attr("fill", (d) =>
                d.isBootNode
                  ? Constants.BOOT_NODE_COLOR
                  : Constants.PEER_NODE_COLOR
              )
              .attr("opacity", Constants.LOWLIGHT_OPACITY)
          )
          .on("mouseenter", function (_, node) {
            d3.select(this).attr("opacity", 1);
            if (!mouseClicked) {
              d3.select("#node-info-card").append("p").text(`IP: ${node.ip}`);
              d3.select("#node-info-card")
                .append("p")
                .text(`Type: ${node.isBootNode ? "Boot Node" : "Peer Node"}`);
            }
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", Constants.LOWLIGHT_OPACITY);
            if (!mouseClicked) {
              d3.selectAll("#node-info-card p").remove();
            }
          });

        link = link.data(links, (d) => [d.source, d.target]).join("line");

        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(0.15).restart();
      };

      update({ nodes, links });
    },
  },
  data: function () {
    return {
      addButtonEnabled: true,
      removeButtonEnabled: false,
    };
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
</style>