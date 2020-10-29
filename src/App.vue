<template>
  <v-app>
    <v-container id="main-container">
      <v-container id="buttons-container">
        <v-btn
          :color="addButtonEnabled ? 'info' : 'normal'"
          class="mx-5"
          @click="toggleButton('addButton')"
        >
          Add Nodes
        </v-btn>
        <v-btn
          :color="removeButtonEnabled ? 'info' : 'normal'"
          class="mx-5"
          @click="toggleButton('removeButton')"
        >
          Remove Nodes
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
import $ from "jquery";

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
      const WIDTH = $(document).width() * 0.7,
        HEIGHT = $(document).height() * 0.7;

      const NODE_RADIUS = 15;

      const BOOT_NODE_COLOR = "greenyellow",
        PEER_NODE_COLOR = "cornflowerblue";

      const LOWLIGHT_OPACITY = 0.55;

      let nodes = [{ id: 0, isBootNode: true, x: WIDTH / 2, y: HEIGHT / 2 }];
      let links = [];

      let checkAddButton = () => this.addButtonEnabled;
      let checkRemoveButton = () => this.removeButtonEnabled;

      let mouseClicked = false;

      let addNode = function (event) {
        if (mouseClicked && checkAddButton()) {
          nodes.push({
            id: nodes[nodes.length - 1].id + 1,
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
            return n.isBootNode || distance > NODE_RADIUS * 1.75;
          });

          update({ nodes, links });
        }
      };

      let svg = d3
        .select("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
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
        .force("x", d3.forceX(WIDTH / 2))
        .force("y", d3.forceY(HEIGHT / 2))
        .force("collide", d3.forceCollide(NODE_RADIUS * 2))
        .force(
          "link",
          d3.forceLink().id((d) => d.id)
        )
        .on("tick", ticked);

      let update = function ({ nodes, links }) {
        node = node
          .data(nodes, (d) => d.id)
          .join((enter) =>
            enter
              .append("circle")
              .attr("r", NODE_RADIUS)
              .attr("fill", (d) =>
                d.isBootNode ? BOOT_NODE_COLOR : PEER_NODE_COLOR
              )
              .attr("opacity", LOWLIGHT_OPACITY)
          )
          .on("mouseenter", function (_, node) {
            d3.select(this).attr("opacity", 1);
            if (!mouseClicked) {
              d3.select("#node-info-card").append("p").text(`ID: ${node.id}`);
              d3.select("#node-info-card")
                .append("p")
                .text(`Type: ${node.isBootNode ? "Boot Node" : "Peer Node"}`);
            }
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", LOWLIGHT_OPACITY);
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