/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/
import * as d3 from 'd3';
import mapData from '../../data/map.json';
//import routeData from '../data/routes.json';
import { geoVoronoi } from 'd3-geo-voronoi';
import * as topojson from 'topojson';
import 'versor';

d3.selection.prototype.map = function init(options) {
  function createChart(el) {
    const $sel = d3.select(el);
    let data = $sel.datum();

    data.usairports.forEach(d => {
      d.incoming = 0;
      d.outgoing = 0;
      d.flights = [];
    })
    let iata = new Map(data.usairports.map(d => [d.IATA, d]))
    data.usroutes.forEach(route => {
      route.source = iata.get(route.ORIGIN);
      route.target = iata.get(route.DEST);
      route.source.outgoing += route.COUPONS;
      route.target.incoming += route.COUPONS;
    });
    //data.usairports.sort((a, b) => d3.descending(a.outgoing, b.outgoing));
    let airportsgeojson = data.usairports.map(airport => {
      return {
        type: "Feature",
        properties: airport,
        geometry: {
          type: "Point",
          coordinates: [airport.Longitude, airport.Latitude]
        }
      }
    })
    // dimension stuff
    let width = 0;
    let height = 0;
    let scale = 0;
    let hypotenuse = 0;

    const marginTop = 0;
    const marginBottom = 0;
    const marginLeft = 0;
    const marginRight = 0;

    // scales
    const scaleX = null;
    const scaleY = null;
    let radiusScale = d3.scaleSqrt()
    let segmentScale = d3.scaleLinear()


    // dom elements
    let $svg = null;
    let $axis = null;
    let $vis = null;

    let airports = null;
    let airportG = null;

    let bundle = null;
    let flights = null;
    let flight = null;

    let voronoiLayer = null;

    let canvas = null;
    let context = null;

    let projection = d3.geoAlbersUsa();

    let canvasPath = d3.geoPath();
    let svgPath = d3.geoPath();

    let polygons = geoVoronoi()
      .polygons(airportsgeojson);

    let layout = d3.forceSimulation();

    let line = d3.line()
      .curve(d3.curveBundle)
      .x(airport => airport.x)
      .y(airport => airport.y);
    //let line = 
    
    const rotate = [110, -40];


    // helper functions

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg');
        const $g = $svg.append('g');

        canvas = $sel.append("canvas");
        context = canvas.node().getContext("2d");


        // offset chart for margins
        $g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');

        // setup viz group
        $vis = $g.append('g').attr('class', 'g-vis');
        airports = $g.append('g').attr("class", "airports");
        voronoiLayer = $g.append('g').attr("class", "voronoi-layer");
        flights = $g.append('g').attr("class", "flights");

        Chart.resize();
        Chart.render();
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height = $sel.node().offsetHeight - marginTop - marginBottom;
        $svg
          	.attr('width', width + marginLeft + marginRight)
          	.attr('height', height + marginTop + marginBottom);

        canvas
            .attr('width', width + marginLeft + marginRight)
            .attr('height', height + marginTop + marginBottom);
        
        hypotenuse = Math.sqrt(width * width + height * height);

        let outgoingMax = d3.max(data.usairports, d => d['outgoing'])
        radiusScale
          .domain([0, outgoingMax])
          .range([width/1000,width/75])
        
        // segmentScale
        //   .domain([0, hypotenuse])
        //   .range([1, 10])
        
        projection
          .scale(width * 1.28)
          .translate([width / 2, height / 2]);

        canvasPath
          .projection(projection)
          .context(context);

        svgPath
          .projection(projection)

        data.usairports.forEach(airport => {
          let coords = projection([airport.Longitude, airport.Latitude]);
          airport.x = coords[0];
          airport.y = coords[1];
        })
        
        //voronoi.extent([[0, 0], [width, height]]);
          

        return Chart;
      },
      // update scales and render chart
      render() {
        

        context.clearRect(0, 0, width, height);

        // context.beginPath();
        // path(topojson.mesh(mapData, mapData.objects.states, (a, b) => a !== b));
        // context.lineWidth = 0.5 / scale;
        // context.strokeStyle = "#000";
        // context.stroke();

        context.beginPath();
        canvasPath(topojson.feature(mapData, mapData.objects.states))
        context.fillStyle = "#f5f5f5";
        context.fill();

        context.beginPath();
        canvasPath(topojson.mesh(mapData, mapData.objects.states, (a, b) => a !== b));
        context.lineWidth = 1 * width / 960;
        context.strokeStyle = "#fff";
        context.stroke();

        
          
        // context.beginPath();
        // canvasPath(topojson.feature(mapData, mapData.objects.roads));
        // context.lineWidth = 0.5 * width/960;
        // context.strokeStyle = '#fff';
        // context.stroke();

        // context.beginPath();
        // canvasPath(topojson.feature(mapData, mapData.objects.urban));
        // context.fillStyle = "#d3d3d3";
        // context.fill();

        airportG = airports.selectAll(".airport-g")
          .data(data.usairports, d => d.IATA)
          .join("g")
          .attr("class", "airport-g")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
        
        airportG.selectAll(".airport")
          .data(d => [d])
          .join("circle")
          .attr("class", "airport")
          .attr("r", d => radiusScale(d.outgoing))
          .each(function(d) {
            d.bubble = this;
          })

        voronoiLayer.selectAll(".airport-voronoi")
          .data(polygons.features)
          .join("path")
          .attr("class", "airport-voronoi")
          .attr("d", svgPath)
          .on("mouseover", d => {
            //console.log(d)
            let airport = d.properties.site.properties;
            //console.log(airport.flights)
            d3.select(airport.bubble)
              .classed("highlight", true);

            d3.selectAll(airport.flights)
              .classed("highlight", true)
              .raise();
          })
          .on("mouseout", d => {
            let airport = d.properties.site.properties;

            d3.select(airport.bubble)
              .classed("highlight", false);

            d3.selectAll(airport.flights)
              .classed("highlight", false);
          })
          //.data(d => voronoi.polygons())
        // console.log(data.usroutes)
        // bundle = generateSegments(data.usairports, data.usroutes)
        flight = flights.selectAll(".flight")
          .data(data.usroutes)
          .join("path")
          // .attr("d", d => {
          //   let {x: sourceX, y: sourceY} = d.source;
          //   let {x: targetX, y: targetY} = d.target
          //   //console.log(sourceX)
          //   // //let targetX = width * singerOffsetX;
          //   // let sourceY = d.y + (d.category == 'parent' ? radius : -radius);
          //   // let targetY = (height * singerOffsetY) + (d.category == 'parent' ? -singerRadius : singerRadius);
          //   let dx = targetX - sourceX;
          //   let dy = targetY - sourceY;
          //   let dr = Math.sqrt(dx * dx + dy * dy);
          //   return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
          // })
          .attr("d", d => line([d.source, d.target]))
          .attr("class", d => {
            //console.log(d)
            return `flight`
          })
          .attr("data-origin", d => d.ORIGIN)
          .attr("data-dest", d => d.DEST)
          .attr("data-carrier", d => d.OPERATING_CARRIER)
          .each(function (d) {
            // adds the path object to our source airport
            // makes it fast to select outgoing paths
            //console.log(d.sour)
            d.source.flights.push(this);
          });

        // https://github.com/d3/d3-force
        // layout
        //   //.nodes(bundle.nodes)
        //   .alphaDecay(0.1)
        //   .force("charge", d3.forceManyBody()
        //     .strength(10)
        //     .distanceMax(radiusScale.range()[1] * 2)
        //   )
        //   // edges want to be as short as possible
        //   // prevents too much stretching
        //   .force("link", d3.forceLink()
        //     .strength(0.7)
        //     .distance(0)

        //   )
        //   .on("tick", function (d) {
        //     //console.log(flight.attr("d"))
        //     flight.attr("d", line);
        //   })
        //   .on("end", function (d) {
        //     console.log("layout complete");
        //   });
        // layout.nodes(data.usairports).force("link").links(data.usroutes);
        // console.log(bundle.nodes)
        // console.log(bundle.links)
        // console.log(bundle.paths)
        //console.log(polygons)
      // context.beginPath();
      // path(topojson.feature(mapData, mapData.objects.roads));
      // context.stroke();
      // context.strokeStyle = '#fff';
      // context.fillStyle = "none";
      // context.fill();

      // context.beginPath();
      // path(topojson.feature(mapData, mapData.objects.world));
      // context.stroke();
      // context.fillStyle = '#fff';
      // context.fill();

        function generateSegments(nodes, links) {
          // generate separate graph for edge bundling
          // nodes: all nodes including control nodes
          // links: all individual segments (source to target)
          // paths: all segments combined into single path for drawing
          let bundle = { nodes: [], links: [], paths: [] };

          // make existing nodes fixed
          bundle.nodes = nodes.map(function (d, i) {
            d.fx = d.x;
            d.fy = d.y;
            return d;
          });

          links.forEach(function (d, i) {
            // calculate the distance between the source and target
            let length = distance(d.source, d.target);

            // calculate total number of inner nodes for this link
            let total = Math.round(segmentScale(length));

            // create scales from source to target
            let xscale = d3.scaleLinear()
              .domain([0, total + 1]) // source, inner nodes, target
              .range([d.source.x, d.target.x]);

            let yscale = d3.scaleLinear()
              .domain([0, total + 1])
              .range([d.source.y, d.target.y]);

            // initialize source node
            let source = d.source;
            let target = null;

            // add all points to local path
            let local = [source];

            for (let j = 1; j <= total; j++) {
              // calculate target node
              target = {
                x: xscale(j),
                y: yscale(j)
              };

              local.push(target);
              bundle.nodes.push(target);

              bundle.links.push({
                source: source,
                target: target
              });

              source = target;
            }

            local.push(d.target);

            // add last link to target node
            bundle.links.push({
              source: target,
              target: d.target
            });

            bundle.paths.push(local);
          });

          return bundle;
        }
		

        return Chart;
      },
      // get / set data
      data(val) {
        if (!arguments.length) return data;
        data = val;
        $sel.datum(data);
        Chart.resize();
        Chart.render();
        return Chart;
      }
    };
    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};



function distance(source, target) {
  var dx2 = Math.pow(target.x - source.x, 2);
  var dy2 = Math.pow(target.y - source.y, 2);

  return Math.sqrt(dx2 + dy2);
}