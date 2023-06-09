const ratio = 500; // Ratio size of the squares in relation to the card size.
const scale = 130; // the higher the value the further apart the squares are

const legendData = [
  { income: "Low income", color: "#fbb4b9" },
  { income: "Lower middle income", color: "#f768a1" },
  { income: "Upper middle income", color: "#c51b8a" },
  { income: "High income", color: "#7a0177" },
  { income: "", color: "#bdbdbd" },
];
const income = legendData.map((d) => d.income);
const colors = legendData.map((d) => d.color);
const colorScale = d3.scaleOrdinal().domain(income).range(colors);

const scaleFactor = 1.5;
const radiusScaleFactor = 100;

const margin = { top: 0, right: 0, bottom: 0, left: 0 },
  width = (850 - margin.left - margin.right) * scaleFactor,
  height = (500 - margin.top - margin.bottom) * scaleFactor,
  padding = 0;

const projection = d3
  .geoEquirectangular()
  .scale(scale * scaleFactor) 
  .translate([width / 2, height / 2]);

const radius = d3
  .scaleSqrt()
  .domain([0, d3.max(data,d=>d.Emissions2019) / radiusScaleFactor]) 
  .range([0, 45]);

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

d3.json("./data/centroid-country.json").then((countries) => {
  countries.features.forEach((country) => {
    data.forEach((countryData) => {
      if (countryData.CountryName === country.properties.name) {
        country.properties.value = countryData.Emissions2019;
        country.properties.income= countryData.income;
        country.properties.CountryCode= countryData.CountryCode;
      }
    });
  });

  const nodes = countries.features.map(function (d) {
    let value = d.properties.value; //*2
    const trueValue = d.properties.value;

    value += 1;

    const point = projection(d.geometry.coordinates),
      RatioReserve = value / ratio, //default = 500
      titre =
        "id: " +
        d.id +
        ", country: " +
        d.properties.name +
        ", value: " +
        trueValue +
        "%";

    return {
      x: point[0],
      y: point[1],
      x0: point[0],
      y0: point[1],
      r: radius(RatioReserve) * scaleFactor,
      titre: titre,
      trueValue: trueValue,
      country: d.properties.name,
      income: d.properties.income || "",
      CountryCode: d.properties.CountryCode || ""
    };
  });


  const nodeG = svg
    .selectAll("g.rectG")
    .data(nodes)
    .join("g")
    .attr("class", "rectG");

  nodeG
    .append("rect")
    .attr("width", (d) => d.r * 2)
    .attr("height", (d) => d.r * 2)
    .attr("fill", (d) => colorScale(d.income))
    .attr("title", (d) => d.titre)
    .attr("x", (d) => d.x - d.r)
    .attr("y", (d) => d.y - d.r);

    nodeG
    .append("text")
    .attr("class", "text")
    .attr("fill", d => d.income === "High income" | d.income === "Upper middle income"? "#fff": "#000")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("text-anchor", "middle")
    .attr("dy", 3)
    .text(d=>d.CountryCode);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "x",
      d3.forceX().x((d) => d.x - d.r)
    )
    .force(
      "y",
      d3.forceY().y((d) => d.y - d.r)
    )
    .force(
      "collision",
      d3.forceCollide().radius((d) => d.r * 1.2 + 1.4)
    )
    .on("tick", function () {
      nodeG
        .selectAll("rect")
        .attr("x", (d) => d.x - d.r)
        .attr("y", (d) => d.y - d.r)

        nodeG.selectAll('.text')
        .attr('x',d=> d.x)
        .attr('y', d=> d.y)
    });
});