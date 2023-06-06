import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WorldMapProps, GeoPathValueFn } from './types';
import fetchCountriesData from './fetchCountriesData';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { select } from 'd3-selection';



const WorldMap = ({ earthquakeData, selectedMonth, bubbleOption, selectedYear = 1990 }: WorldMapProps) => {
    const chartRef = useRef(null);

    const rgbToHex = (red: number, green: number, blue: number) => {
        // Convert RGB values to hexadecimal format
        var rgb = blue | (green << 8) | (red << 16);
        return "#" + (0x1000000 + rgb).toString(16).slice(1);
    }

    const magnitudeScaleToColor = (magnitude: number) => {
        if (magnitude <= 5.5) {
            return "#00ff00";
        } else if (magnitude < 6.0) {
            // Calculate the green value based on the magnitude within the range
            var green = Math.floor((magnitude - 5.5) * (255 / 0.5));
            return rgbToHex(0, green, 0);
        } else if (magnitude < 7.0) {
            // Calculate the red value based on the magnitude within the range
            var red = Math.floor((magnitude - 6.0) * (255 / 1.0));
            return rgbToHex(red, 255, 0);
        } else if (magnitude < 8.0) {
            // Calculate the green value based on the magnitude within the range
            var green = Math.floor((8.0 - magnitude) * (255 / 1.0));
            return rgbToHex(255, green, 0);
        } else {
            return "#ff0000";
        }
    }

    const mapScale = (depth: number, minInput: number = 0, maxInput: number = 10, minOutput: number = 1, maxOutput: number = 20) => {
        const scaledValue = (depth - minInput) / (maxInput - minInput);
        const size = (scaledValue * (maxOutput - minOutput)) + minOutput;
        return size;
    };

    useEffect(() => {

        const drawMap = async () => {

            if (chartRef.current) {
                const width = window.innerWidth;
                const height = window.innerHeight;

                // Clear the previous content of chartRef
                d3.select(chartRef.current).html('');

                // Create SVG
                const svg = d3.select(chartRef.current)
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height);

                // Append empty placeholder g element to the SVG
                // g will contain geometry elements
                const map = svg.append('g');
                const earthquakes = svg.append('g');
                const world: Topology = await fetchCountriesData();
                const land = feature(world, world.objects.land);

                // Define projection
                const projection = d3.geoEqualEarth()
                    .fitSize([width, height], land);

                // Update the projection scale and translation based on the container size
                projection.scale(projection.scale() * 0.8);
                projection.translate([width / 2, height / 2]);

                // Define path generator
                const path = d3.geoPath().projection(projection);
                const graticule = d3.geoGraticule10();
                const borders = feature(world, world.objects.countries);

                // Draw the map elements
                map.append('path')
                    .datum(graticule)
                    .attr('d', path as GeoPathValueFn)
                    .attr('stroke', '#ccc')
                    .attr('fill', '#000')
                    .attr('opacity', 0.4)
                    .attr('class', 'graticule');

                /*map.append('path')
                    .datum(land)
                    .attr('d', path as GeoPathValueFn)
                    .attr('class', 'land')
                    .attr('fill', '#fff');*/

                map.append('path')
                    .datum(borders)
                    .attr('d', path as GeoPathValueFn)
                    .attr('stroke', '#ccc')
                    .attr('class', 'borders');

                // Add circles representing earthquakes
                earthquakes.selectAll('.quake')
                    .data(earthquakeData.filter(d => d.month === selectedMonth.month && d.year === selectedYear))
                    .enter()
                    .append('circle')
                    .attr('class', 'quake')
                    .attr('cx', d => projection([d.longitude, d.latitude])[0])
                    .attr('cy', d => projection([d.longitude, d.latitude])[1])
                    .attr('r', d => mapScale(d.magnitude))
                    .attr("stroke", d => magnitudeScaleToColor(d.magnitude))
                    .attr("stroke-width", 1)
                    .attr("fill", d => magnitudeScaleToColor(d.magnitude))
                    .attr("fill-opacity", 0.4);
            }

        }

        drawMap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earthquakeData, selectedMonth.month, selectedYear]);

    return <div ref={chartRef} className="world-map"></div>;
};

export default WorldMap;