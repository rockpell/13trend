var charts = {};

charts.bubble = function() {
  if (!bubble.id) bubble.id = 0;
  // overall size info
  var width = 800,
      height = 600,
      margin = {top: 0, bottom: 0, left: 0, right: 0},
      // scales
      colors = d3.scale.category20c(),
      r = d3.scale.sqrt(),
      // accessors
      rValue = function(d) { return d.radius; },
      colorValue = function(d) { return d.color; },
      nameValue = function(d) { return d.name; },
      typeValue = function(d) { return d.type; },
      // chart enhancements
      center = null,
      centers = null,
      formatNumber = d3.format(",d"),
      outline = 0,
      force = d3.layout.force(),
      called = false,
      id = bubble.id++;

  var div = d3.select("body").append("div")   
              .attr("class", "tooltip bubble")               
              .style("opacity", 0)
              .attr("id", "bubble-tooltip-"+id);
 
  function bubble(selection) {
    selection.each(function(data) {
      var w = width - margin.left - margin.right,
          h = height - margin.top - margin.bottom;
      if (center === null) center = {x: w/2, y: h/2};

      data = data.map(function(d, i) {
        return {
          r: r(rValue.call(data, d, i)),
          color: colorValue.call(data, d, i),
          name: nameValue.call(data, d, i),
          type: typeValue.call(data, d, i),
        };
      });
      // if (!called) {
        force
          .nodes(data)
          .size([w,h]);
      //   called = true;
      // }
      force.start();
      console.log("LOG:",data);
        
      var svg = d3.select(this)
                      .selectAll("svg")
                          .data([data]);
                          // .text(function(d){
                          //   return d;
                          // });
      var svgEnter = svg.enter()
                    .append("svg")
                      .attr("width", w)
                      .attr("height", h)  
                        .append("g");
      var g = svg.select('g'),
          node = g.selectAll(".node");

      var nodes = node.data(data);
      nodes.enter()
          // .transition()
          //   .duration(500)
                .append("circle")
                  .attr("class", "node")
                  .on("mouseover", function(d) {      
                    div.transition()        
                        .duration(200)      
                        .style("opacity", .9);      
                    div.html(d.name + "<br/>" + d.r.toFixed(2))  
                        .style("left", (d3.event.pageX) + "px")     
                        .style("top", (d3.event.pageY - 28) + "px");    
                  })                  
                  .on("mouseout", function(d) {       
                    div.transition()        
                        .duration(500)      
                        .style("opacity", 0); 
                  });
            
      nodes.append("div")
            .text(function(d){return d.name});
            
      nodes
          // .transition()
          //   .duration(500)
            .attr("r", function(d) { return d.r; })
            .style("fill", function(d) { return colors(d.color); })
            .style("stroke", function(d) { return d3.rgb(colors(d.color)).darker(outline); })
            .call(force.drag);
      nodes.exit()
            .transition()
              .duration(500)
                .attr("r", 0)
                .style("opacity", 0)
                .remove();

      force.on("tick", function(e) {
        //TODO centers code

        var q = d3.geom.quadtree(data),
            i = 0,
            n = data.length;

        while (++i < n) {
          q.visit(collide(data[i]));
        }

        nodes
            .attr("cx", function(d) { return d.x = Math.max(d.r, Math.min(w - d.r, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(d.r, Math.min(h - d.r, d.y)); });
      }); 
    });
  }

  function collide(node) {
    var r = node.r + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
            y = node.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = node.r + quad.point.r;
        if (l < r) {
          l = (l - r) / l * .5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    };
  }

  // overall size info
  bubble.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return bubble;
  };
  bubble.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return bubble;
  };
  bubble.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return bubble;
  };

  // scales
  bubble.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    return bubble;
  };
  bubble.r = function(_) {
    if (!arguments.length) return r;
    r = _;
    return bubble;
  };

  // accessors
  bubble.colorValue = function(_) {
    if (!arguments.length) return colorValue;
    colorValue = d3.functor(_);
    return bubble;
  };
  bubble.rValue = function(_) {
    if (!arguments.length) return rValue;
    rValue = d3.functor(_);
    return bubble;
  };
  bubble.nameValue = function(_) {
    if (!arguments.length) return nameValue;
    nameValue = d3.functor(_);
    return bubble;
  };
  bubble.typeValue = function(_) {
    if (!arguments.length) return typeValue;
    typeValue = d3.functor(_);
    return bubble;
  };

  // chart enhancements
  bubble.center = function(_) {
    if (!arguments.length) return center;
    center = _;
    return bubble;
  };
  bubble.centers = function(_) {
    if (!arguments.length) return centers;
    centers = _;
    return bubble;
  };
  bubble.minRadius = function(_) {
    if (!arguments.length) return minRadius;
    minRadius = _;
    return bubble;
  };
  bubble.formatNumber = function(_) {
    if (!arguments.length) return formatNumber;
    formatNumber = _;
    return bubble;
  };
  bubble.outline = function(_) {
    if (!arguments.length) return outline;
    outline = _;
    return bubble;
  };
  bubble.force = function(_) {
    if (!arguments.length) return force;
    force = _;
    return bubble;
  };

  return bubble;
};