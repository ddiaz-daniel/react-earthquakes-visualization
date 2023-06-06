import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  EarthquakeData,
  EarthquakesByMonth,
  MonthLineChartProps,
} from "./types";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MonthLineChart = ({
  earthquakeData,
  selectedYear,
}: MonthLineChartProps) => {
  const chartRef = useRef(null);

  const getMonthLineData = () => {
    const yearGroupedData = d3.group(earthquakeData, (d) => d.year);
    const currentYear = yearGroupedData.get(selectedYear);
    if (!currentYear) return [];
    const monthGroupedData = d3.group(currentYear, (d) => d.month);

    const monthLineData: EarthquakesByMonth[] = [...monthGroupedData]
      .map((eq) => {
        if (!isNaN(eq[0])) {
          return { month: eq[0], amount: eq[1].length };
        }
      })
      .filter(Boolean) as unknown as EarthquakesByMonth[];
    return monthLineData;
  };

  useEffect(() => {
    const drawLineChart = async () => {
      if (chartRef.current) {
        const width = 1450;
        const height = 300;
        const margin = { top: 20, right: 200, bottom: 30, left: 200 };

        // Clear the previous content of chartRef
        d3.select(chartRef.current).html("");
        const data = getMonthLineData();

        // Create SVG
        const svg = d3
          .select(chartRef.current)
          .append("svg")
          .attr("width", width)
          .attr("height", height);

        const xScale = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d.month) as number[])
          .range([margin.left, width - margin.right]);

        const yScale = d3
          .scaleLinear()
          .domain([0, 230])
          .range([height - margin.bottom, margin.top]);

        const xAxis = (g, scale = xScale) =>
          g.attr("transform", `translate(0,${height - margin.bottom})`).call(
            d3
              .axisBottom(scale)
              .ticks(width / 80)
              .tickSizeOuter(0)
              .tickFormat((x) => months[x])
          );

        const yAxis = (g, scale = yScale) =>
          g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(scale).ticks(height / 40));

        const line = d3
          .line()
          .x((d) => xScale(d.month))
          .y((d) => yScale(d.amount));

        svg
          .append("g")
          .attr("transform", `translate(0, ${height - margin.bottom})`)
          .call(xAxis);
        svg
          .append("g")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(yAxis);

        // vertical line and tooltip
        // vertical line and "tooltip"
        const verticalLine = svg
          .append("line")
          .attr("class", "vertical-line")
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 0)
          .attr("y2", 700)
          .style("opacity", 0);

        const tooltip = svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", 10)
          .attr("y", 10)
          .style("color", "white")
          .style("fill", "white")
          .style("opacity", 0);

        svg
          .append("g")
          .attr("transform", `translate(0, ${height - margin.bottom})`)
          .call(xAxis);
        svg
          .append("g")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(yAxis);

        svg
          .append("path")
          .datum(data)
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("stroke-miterlimit", 1);

        svg.on("mousemove", handleMouseMove).on("mouseout", handleMouseOut);

        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);

        // mouse event functions
        function handleMouseMove(event) {
          const mouseX = d3.pointer(event)[0];

          let xPosition = mouseX;
          if (xPosition - margin.left < 0) {
            // no line outside of y axis
            xPosition = margin.left;
          } else if (xPosition + margin.right > width) {
            xPosition = width - margin.right;
          }

          verticalLine
            .attr("x1", xPosition)
            .attr("x2", xPosition)
            .style("opacity", 1);

          const x0 = xScale.invert(xPosition);
          const bisect = d3.bisector((d) => d.month).center;
          const index = bisect(data, x0);
          const selectedData = data[index];

          const tooltipText = `${months[selectedData.month]}: ${selectedData.amount
            } Earthquakes`;
          tooltip
            .text(tooltipText)
            .style("opacity", 1)
            .attr("x", xPosition + 10)
            .attr("y", 75);
        }

        function handleMouseOut() {
          verticalLine.style("opacity", 0);
          tooltip.style("opacity", 0);
        }
      }
    };

    drawLineChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earthquakeData, selectedYear]);

  return <div ref={chartRef} className="month-line-chart"></div>;
};

export default MonthLineChart;
