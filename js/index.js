const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected = '';

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){
        yParam = d3.select(this).property('value');
        updateScattePlot();

    });

    d3.select('#param').on('change', function(){
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function(){
        lineParam = d3.select(this).property('value');
        updateLineChart();
    });

    function updateBar(){
      regions = d3.set(data.map(d=>d.region)).values();
      let colorScale = d3.scaleOrdinal().domain(regions).range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);

      var dict_r = [];
      regions.forEach(function(r){
        values = data.filter(function(d){return d.region == r;});
        dict_r.push({ 'region' : r, 'values' : d3.mean(values, d => d[param][year])});
      });

      let y = d3.scaleLinear().domain([d3.min(dict_r, d => d.values),
        d3.max(dict_r, d => +d.values) + 0.5* d3.min(dict_r, d => d.values)
      ]).range([height-margin, margin]);

      let x = d3.scaleBand().domain(regions).range([margin*2, barWidth-margin]).padding(0.1);
      xBarAxis.call(d3.axisBottom().scale(x));
      yBarAxis.call(d3.axisLeft().scale(y));

      barChart.selectAll('rect').remove();

      var bars = barChart.append('g').selectAll("rect")
      .data(dict_r)
      .enter().append("rect")
      .attr("region", d => d.region)
      .style("fill", d => colorScale(d.region))
      .attr("x", d => x(d.region))
      .attr("width", '80')
      .attr("y", d => y(d.values) - margin)
      .attr("height", d => height - y(d.values))
      .on("click", function(d) {
        barChart.selectAll('rect')
                .transition()
                .attr('fill-opacity', 0.5);
        d3.select(this)
          .transition()
          .attr('fill-opacity', 1);
        let col = d3.select(this).attr("region");
        scatterPlot.selectAll('circle')
                   .filter(function(d) { return d.region != col; })
                   .style('fill-opacity', 0)
                   .style('opacity', 0);
        scatterPlot.selectAll('circle')
                   .filter(function(d) { return d.region == col; })
                   .style('fill-opacity', 0.7)
                   .style('opacity', 1);

            })
      .on("mouseout", function(d) {
        barChart.selectAll("rect").transition()
          .attr('fill-opacity', 1);
        scatterPlot.selectAll('circle')
                   .transition()
                   .style('fill-opacity', 0.7)
                   .style('opacity', 1);
            });


        return;
    }

    function updateScattePlot(){

      let extent_x = d3.extent(data, d => +d[xParam][year]);
      let extent_y = d3.extent(data, d => +d[yParam][year]);
      let extent_r = d3.extent(data, d => +d[rParam][year]);

      let radiusScale = d3.scaleSqrt().domain(extent_r).range([10, 30]);
      let x = d3.scaleLinear().domain(extent_x).range([margin*2, width-margin]);
      let y = d3.scaleLinear().domain(extent_y).range([height-margin, margin]);

      xAxis.call(d3.axisBottom().scale(x));
      yAxis.call(d3.axisLeft().scale(y));


      d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
      };

      scatterPlot.selectAll('circle').remove();

      var circles = scatterPlot.append('g').selectAll('circle')
      .data(data).enter()
      .append('circle')
      .attr('region', d => d.region)
      .attr('country', d => d.country)
      .attr('r',  d => radiusScale(d[rParam][year]))
      .attr('fill',  d => colorScale(d.region))
      .attr('cx', d => x(d[xParam][year]))
      .attr('cy', d => y(d[yParam][year]))
      .attr("stroke-width", 0.4)
      .on('click', function(d) {
            d3.selectAll('circle')
                   .style('fill-opacity', 0.7)
                   .style('opacity', 1)
                   .style("stroke-width", 0.4);
            d3.select(this).moveToFront();
            d3.select(this).transition()
            .style('fill-opacity', 1)
            .style('opacity', 1)
            .style("stroke", "black")
            .style("stroke-width", 1);
            selected = d3.select(this).attr("country");
            updateLineChart();
            countryName.html(selected);

          })
      .on('mouseout', function(d) {
          d3.selectAll('circle')
                     .transition()
                     .style('fill-opacity', 0.7)
                     .style('opacity', 1)
                     .style("stroke-width", 0.4);
              });


      ;



        return;
    }

    function updateLineChart(){

      if (selected != ''){

        var country = data.find(d => (d.country == selected));
        var years = Object.keys(country[lineParam]).slice(0, 221)

        var dict_c = [];
        years.forEach(function(d){
            dict_c.push({'year' : d3.timeParse("%Y")(d), 'value' : Number(country[lineParam][d])});
            return;
        });

        let extent_x = d3.extent(dict_c, d => +d.year);
        let extent_y = d3.extent(dict_c, d => +d.value);

        let x = d3.scaleTime().domain(extent_x).range([margin*2, width-margin]);
        let y = d3.scaleLinear().domain(extent_y).range([height-margin, margin]);
        xLineAxis.call(d3.axisBottom().tickFormat(d3.timeFormat("%Y")).scale(x));
        yLineAxis.call(d3.axisLeft().scale(y));


        lineChart.select(".line_data").remove();

        lineChart.append("g")
        .append("path")
        .data([dict_c])
        .attr("class", "line_data")
        .attr("stroke", 'rgb(36, 138, 181)')
        .attr("d", d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value)))
        .attr("stroke-width", 2)
        .style("fill", "none");

      };
        return;
    }

    updateBar();
    updateLineChart();
    updateScattePlot();


});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}
