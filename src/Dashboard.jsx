import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styled, { ThemeProvider } from 'styled-components';
import data from './data.json';

const darkTheme = {
  background: '#141414',
  text: '#ffffff'
};

const Container = styled.div`
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
`;

const ChartRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ChartContainer = styled.div`
  margin: 20px;
  flex: 1;
  min-width: 300px;

  @media (max-width: 768px) {
    width: 100%;
    margin: 10px 0;
  }
`;

const prepareLineData = (data) => {
  return data.map(d => ({
    date: new Date(d.timestamp),
    severity: d.alert ? d.alert.severity : 0
  }));
};

const prepareBarData = (data) => {
  return data.map(d => ({
    port: d.dest_port,
    severity: d.alert ? d.alert.severity : 0
  }));
};

const preparePieData = (data) => {
  const categories = {};
  data.forEach(d => {
    const category = d.alert ? d.alert.category : '';
    categories[category] = (categories[category] || 0) + 1;
  });
  return Object.entries(categories).map(([category, count]) => ({ category, count }));
};

const drawLineChart = (data, svgRef) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.severity)])
    .nice()
    .range([height, 0]);

  const xAxis = g => g
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  const yAxis = g => g
    .call(d3.axisLeft(y));

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.severity));

  const svg = d3.select(svgRef.current)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);
};

const drawBarChart = (data, svgRef) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(data.map(d => d.port))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.severity)])
    .nice()
    .range([height, 0]);

  const xAxis = g => g
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  const yAxis = g => g
    .call(d3.axisLeft(y));

  const svg = d3.select(svgRef.current)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.port))
    .attr("y", d => y(d.severity))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.severity))
    .attr("fill", "steelblue");
};

const drawPieChart = (data, svgRef) => {
  const width = 500;
  const height = 500;
  const radius = Math.min(width, height) / 2;
  const color = d3.scaleOrdinal().range(["#8884d8", "#82ca9d", "#ffc658"]);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const pie = d3.pie()
    .value(d => d.count);

  const svg = d3.select(svgRef.current)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const arcs = svg.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.category));

  const legend = svg.selectAll(".legend")
    .data(data)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(-20,${i * 20 - 20})`);

  legend.append("rect")
    .attr("x", width / 2 - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => color(d.category));

  legend.append("text")
    .attr("x", width / 2 - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("fill", "#fff")
    .text(d => d.category);
};
const drawScatterPlot = (data, svgRef) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.src_port)])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.dest_port)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = d3.select(svgRef.current)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.src_port))
    .attr("cy", d => y(d.dest_port))
    .attr("r", 5)
    .style("fill", "#8884d8");
};




const Dashboard = () => {
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const scatterPlotRef = useRef(null); // Add ref for scatter plot

  useEffect(() => {
    const lineData = prepareLineData(data);
    const barData = prepareBarData(data);
    const pieData = preparePieData(data);
    const scatterPlotData = data.slice(0, 100); // Adjust the number of data points as needed

    drawLineChart(lineData, lineChartRef);
    drawBarChart(barData, barChartRef);
    drawPieChart(pieData, pieChartRef);
    drawScatterPlot(scatterPlotData, scatterPlotRef); // Draw scatter plot
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Container>
        <h1>Network Alerts Dashboard</h1>
        <ChartRow>
          <ChartContainer>
            <h2>Number of Alerts Over Time</h2>
            <svg ref={lineChartRef}></svg>
          </ChartContainer>
          <ChartContainer>
            <h2>Alerts by Port</h2>
            <svg ref={barChartRef}></svg>
          </ChartContainer>
        </ChartRow>
        <ChartRow> {/* Add a new row for scatter plot */}
          <ChartContainer>
            <h2>Alerts by Category</h2>
            <svg ref={pieChartRef}></svg>
          </ChartContainer>
          <ChartContainer>
            <h2>Scatter Plot of Ports</h2>
            <svg ref={scatterPlotRef}></svg> {/* Add scatter plot SVG */}
          </ChartContainer>
        </ChartRow>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;

