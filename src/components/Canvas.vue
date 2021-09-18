<template>
  <div class="container">
    <!-- 把panel组件放在这里面——以标签的方式添加到根结点，它是Canvas的一个子组件，所以Canvas分画布和面板两个部分 -->
    <detail-panel ref="detailPanel" @update="getQueryResult"></detail-panel><!--别名叫detailPanel-->
  </div>
</template>

<script>
  import * as d3 from "d3"
  import DetailPanel from './DetailPanel'
  export default {
    name: 'Canvas',
    components:{DetailPanel},
    data () {
      return {
        svgArea:null,
        links: [],
        nodes: [],
        nodesName: [],
        linksName: [],
        simulation: null,
        scale:1,
        width:600,
        height:800,
        colorList: ["red", '#3388B1', "green", "purple", "orange", "yellow", "pink", "brown", "grey", "gold"],
        testGraph: {
          "nodes": [],
          "links": []
        }
      }
    },
    created () {
      this.getGraphData()
    },
    methods: {
      getGraphData() {
        var _this = this
        this.axios.get("ecode/" + "001CW")
        //   this.axios.get("ecode/" + "all")
          .then(function (response) {
            // _this.testGraph["nodes"] = response.data
            _this.testGraph["nodes"] = [response.data]
            _this.initGraph(_this.testGraph)
          })
          .catch(function (error) {
            console.log(error)
          })
      },

      initGraph(data) {
        const links = data.links;
        const nodes = data.nodes;

        this.simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id).distance(150))
          .force("collide", d3.forceCollide().radius(() => 30))
          .force("charge", d3.forceManyBody().strength(-10))
          .force("center", d3.forceCenter(this.width / 2, this.height / 2));

        this.svgArea = d3.select(".container")
          .append("svg")
          .attr("viewBox", [0, 0, this.width, this.height])

        this.addMarkers();

        const g = this.svgArea.append("g")
          .attr("class","content");

        const zoom = d3.zoom()
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          })
          .scaleExtent([1 / 10 , 40]);
        this.svgArea.call(zoom);

        this.links = g.append("g")
          .selectAll("path")
          .data(links,function (d){
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .join("path")
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.6)
          .attr("marker-end", "url(#positiveMarker)")
          .attr("stroke-width", d => Math.sqrt(d.value))
          .attr("class", "link")
          .attr("id", function (d){
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          });/*id是自己命名，要求独一无二，这里是source_rel_target,比如某条线的id是"001CW_对应设备名称_啥啥啥"*/

        this.linksName = g.append("g")
          .selectAll("text")
          .data(links,function (d){
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .join('text')
          .style("text-anchor", "middle")
          .style('fill', 'white')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .append('textPath')
          .attr(
            'xlink:href', d => "#"+d.source+"_"+d.relationship+"_"+d.target
          )
          .attr("startOffset", "50%")
          .text(d => d.relationship);

        this.nodes = g.append("g")
          .selectAll("circle")
          .data(nodes,d => d.id)
          .join("circle")
          .attr("r", 30)
          .attr("class", "node")
          .attr("fill", this.color)
          .on("click", this.select)
          .call(this.drag(this.simulation));

        this.nodes.append("title")
          .text(d => d.id);

        this.nodesName = g.append("g")
          .selectAll("text")
          .data(nodes)
          .join("text")
          .text(d => d.id)
          .attr("dx" , function () {
            return this.getBoundingClientRect().width / 2 * (-1)
          })
          .attr("dy" , 50)
          .attr("class", "nodeName");


        this.simulation.on("tick", () => {
          this.links
            .attr("d", function(d){
              if(d.source.x<d.target.x){
                return "M "+d.source.x+" "+ d.source.y +" L "+d.target.x+" "+d.target.y
              }
              else{
                return "M "+d.target.x+" "+ d.target.y +" L "+d.source.x+" "+d.source.y
              }
            })
            .attr("marker-end",function (d) {
              if(d.source.x<d.target.x){
                return "url(#positiveMarker)"
              }
              else{
                return null
              }
            })
            .attr("marker-start",function (d) {
              if(d.source.x<d.target.x){
                return null
              }
              else{
                return "url(#negativeMarker)"
              }
            })

          this.nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

          this.nodesName
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        });
      },

      addMarkers(){
        const positiveMarker = this.svgArea.append("marker")
          .attr("id","positiveMarker")
          .attr("orient","auto")
          .attr("stroke-width",2)
          .attr("markerUnits", "strokeWidth")
          .attr("markerUnits", "userSpaceOnUse")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 35)
          .attr("refY", 0)
          .attr("markerWidth", 12)
          .attr("markerHeight", 12)
          .append("path")
          .attr("d", "M 0 -5 L 10 0 L 0 5")
          .attr('fill', '#999')
          .attr("stroke-opacity", 0.6);
        const negativeMarker = this.svgArea.append("marker")
          .attr("id","negativeMarker")
          .attr("orient","auto")
          .attr("stroke-width",2)
          .attr("markerUnits", "strokeWidth")
          .attr("markerUnits", "userSpaceOnUse")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", -25)
          .attr("refY", 0)
          .attr("markerWidth", 12)
          .attr("markerHeight", 12)
          .append("path")
          .attr("d", "M 10 -5 L 0 0 L 10 5")
          .attr('fill', '#999')
          .attr("stroke-opacity", 0.6);
      },

      updateGraph(data) {
        const links = data.links;
        const nodes = data.nodes;

        this.links = this.links
          .data(links, function (d) {
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .join("path")
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", d => Math.sqrt(d.value))
          .attr("marker-end", "url(#positiveMarker)")
          .merge(this.links)
          .attr("id", function (d) {
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .attr("class", "link");

        this.linksName = this.linksName
          .data(links, function (d) {
            if (typeof (d.source) === 'object'){
              return d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .join('text')
          .style("text-anchor", "middle")
          .style('fill', 'white')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .append('textPath')
          .attr(
            'xlink:href', function (d) {
            if (typeof (d.source) === 'object'){
              return "#"+d.source.id+"_"+d.relationship+"_"+d.target.id
            } else {
              return "#"+d.source+"_"+d.relationship+"_"+d.target
            }
          })
          .attr("startOffset", "50%")
          .merge(this.linksName)
          .text(d => d.relationship);

        this.nodes = this.nodes
          .data(nodes,d=>d.id)
          .join("circle")
          .attr("r", 30)
          .attr("class", "node")
          .attr("fill", this.color)
          .merge(this.nodes)
          .on("click", this.select)
          .call(this.drag(this.simulation));

        this.nodes.append("title")
          .text(d => d.id);

        this.nodesName = this.nodesName
          .data(nodes)
          .join("text")
          .merge(this.nodesName)
          .text(d => d.id)
          .attr("dx" , function () {
            return this.getBoundingClientRect().width / 2 * (-1)
          })
          .attr("dy" , 50)
          .attr("class", "nodeName")

        this.simulation.nodes(nodes)
        this.simulation.force("link").links(links)
        this.simulation.alpha(0.2).restart()

      },

      color(d) {
        return this.colorList[d.group];
      },

      drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }

        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0.5);
          /*
          注释以下代码，使拖动结束后固定节点
          event.subject.fx = null;
          event.subject.fy = null;

          */
        }

        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      },

      select(event, d) {
        var _this = this
        let data = {}
        for (var i in  d.obj) {
          let ifArray = d.obj[i] instanceof Array
          if (!ifArray) {
            data[i] = d.obj[i]
          }
        }
        //_this.$refs.detailPanel.currentNode = d.obj  /*点击的时候，此命令获得Panel组件，把d传进去，d是被点击的那个结点*/
        _this.$refs.detailPanel.currentNode = data  /*不显示关系对应的数组*/
        _this.$refs.detailPanel.ifShow = true
      },

      getQueryResult (result, currentNode, currentType) {
        for (var i = 0; i < result.length; i++) {
          let flag = true
          for (var j=0; j <this.testGraph.nodes.length; j++) {
            if(this.testGraph.nodes[j].id === result[i].id){
              flag = false
            }
          }
          if(flag){
            this.testGraph.nodes.push(result[i])
          }
          else {
            /*console.log("已存在的结点")
            console.log(result[i])*/
          }

          /*
          */
          this.testGraph.links.push({
            "source":currentNode.eCodeId,
            "target":result[i].id,
            "value":5,
            "relationship":currentType
          })
        }
        for (var i=this.testGraph.links.length-1;i>=0;i--){
          if (this.testGraph.links[i].source.id === currentNode.eCodeId && this.testGraph.links[i].relationship != currentType){
            let ifRemove = true;
            for (var k=0;k<result.length;k++){
              if (result[k].id === this.testGraph.links[i].target.id){
                ifRemove = false
                // console.log("不移除此节点"+result[k].id)
                break
              }
            }
            if (ifRemove){
              for (var j=this.testGraph.nodes.length-1;j>=0;j--){
                if (this.testGraph.nodes[j].id === this.testGraph.links[i].target.id){
                  this.testGraph.nodes.splice(j, 1)
                }
              }
            }
            this.testGraph.links.splice(i, 1)
          }
        }
        this.updateGraph(this.testGraph)
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  body{
    margin: 0px;
  }
  .container{
    width: 80%;
    height: 95%;
    border: 1px solid #2c3e50;
    border-radius:8px;
    margin-top: 40px;
    margin-left: auto;
    margin-right: auto;
    background-image: radial-gradient(circle, #99CCCC, #483D8B);
  }
  .node{
    stroke:#fff;
    stroke-width:1;
    cursor: pointer;
  }
  .node:hover{
    stroke-width:5;
  }
  .nodeName{
    fill:white;
  }
</style>
